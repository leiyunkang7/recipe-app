/**
 * Google OAuth Initiation Endpoint
 *
 * GET /api/auth/google
 * Redirects to Google's OAuth consent screen
 */

import { defineEventHandler, sendRedirect } from 'h3';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.SITE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

export default defineEventHandler(async (event) => {
  if (!GOOGLE_CLIENT_ID) {
    throw createError({
      statusCode: 500,
      message: 'Google OAuth is not configured',
    });
  }

  // Generate state parameter for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store state in cookie for verification
  setCookie(event, 'oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    state,
    prompt: 'select_account',
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  return sendRedirect(event, googleAuthUrl);
});
