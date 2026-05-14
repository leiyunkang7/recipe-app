/**
 * Google OAuth Callback Endpoint
 *
 * GET /api/auth/google/callback
 * Handles the OAuth callback from Google
 */

import { defineEventHandler, getQuery, getCookie, deleteCookie } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { users, favoriteFolders } from '@recipe-app/database';
import { createSession, setSessionCookie } from '../../utils/session';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.SITE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

// Default folders for new OAuth users
const DEFAULT_FOLDERS = [
  { name: 'My Favorites', color: '#F97316' },
  { name: 'Want to Cook', color: '#10B981' },
];

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
  id_token?: string;
  scope: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

/**
 * Exchange authorization code for access token
 */
async function getGoogleAccessToken(code: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  const data: GoogleTokenResponse = await response.json();
  return data.access_token;
}

/**
 * Get user info from Google
 */
async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info from Google');
  }

  return response.json();
}

/**
 * Generate a unique username from Google name
 */
function generateUsername(name: string, email: string): string {
  if (!name || !email) return 'user' + Math.random().toString(36).substring(2, 6);
  // Try to use name first, then email prefix
  let base = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 16);
  if (!base || base.length < 3) {
    base = email.split('@')[0]!.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  
  // Add random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}${suffix}`;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  // Check for error from Google
  if (query.error) {
    return sendRedirect(event, '/?error=oauth_denied', 302);
  }

  const code = query.code as string;
  const state = query.state as string;
  
  // Verify state parameter for CSRF protection
  const savedState = getCookie(event, 'oauth_state');
  deleteCookie(event, 'oauth_state');
  
  if (!state || state !== savedState) {
    throw createError({
      statusCode: 400,
      message: 'Invalid OAuth state',
    });
  }

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Authorization code is required',
    });
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw createError({
      statusCode: 500,
      message: 'Google OAuth is not configured',
    });
  }

  try {
    // Step 1: Get access token from Google
    const accessToken = await getGoogleAccessToken(code);
    
    // Step 2: Get user info from Google
    const googleUser = await getGoogleUserInfo(accessToken);
    
    if (!googleUser.verified_email) {
      throw createError({
        statusCode: 400,
        message: 'Google email is not verified',
      });
    }

    const db = useDb();
    
    // Step 3: Check if user exists with this Google provider
    let user = await db
      .select()
      .from(users)
      .where(eq(users.providerId, googleUser.id))
      .limit(1)
      .then(r => r[0]!);

    // Step 4: If user doesn't exist, check if email already exists
    if (!user) {
      const existingEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, googleUser.email))
        .limit(1)
        .then(r => r[0]!);

      if (existingEmail) {
        // Email already registered - link Google account to existing user
        await db
          .update(users)
          .set({
            provider: 'google',
            providerId: googleUser.id,
            avatarUrl: googleUser.picture,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingEmail.id));
        
        user = await db
          .select()
          .from(users)
          .where(eq(users.id, existingEmail.id))
          .limit(1)
          .then(r => r[0]!);
      } else {
        // Create new user
        const username = generateUsername(googleUser.name, googleUser.email);
        
        user = await db.transaction(async (tx) => {
          const [newUser] = await tx
            .insert(users)
            .values({
              email: googleUser.email,
              username,
              displayName: googleUser.name,
              avatarUrl: googleUser.picture,
              role: 'user',
              emailVerified: true,
              emailVerifiedAt: new Date(),
              provider: 'google',
              providerId: googleUser.id,
            })
            .returning();

          if (!newUser) {
            throw new Error('Failed to create user');
          }

          // Create default favorite folders
          await tx.insert(favoriteFolders).values(
            DEFAULT_FOLDERS.map((folder, index) => ({
              userId: newUser.id,
              name: folder.name,
              color: folder.color,
              sortOrder: index,
            }))
          );

          return newUser;
        });
      }
    } else {
      // Update user's avatar if changed
      await db
        .update(users)
        .set({
          avatarUrl: googleUser.picture,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    // Step 5: Create session
    const sessionId = await createSession(user.id);
    setSessionCookie(event, sessionId);

    // Step 6: Redirect to home page
    return sendRedirect(event, '/', 302);
  } catch (error) {
    console.error('[google-callback] Error:', error);
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'OAuth authentication failed',
    });
  }
});
