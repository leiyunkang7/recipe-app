/**
 * User Login API Endpoint
 *
 * POST /api/auth/login
 * Request body: { email, password }
 * Response: { success: boolean, user?: User, error?: { code: string, message: string } }
 */

import { defineEventHandler, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { useDb } from '../../utils/db';
import { users } from '@recipe-app/database';
import { createSession, setSessionCookie } from '../../utils/session';
import { rateLimiters } from '../../utils/rateLimit';
import { LoginSchema, type User, type ServiceResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  // Apply strict rate limiting for authentication endpoints
  await rateLimiters.auth(event);

  const body = await readBody(event);

  // Validate request body
  const validationResult = LoginSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email or password format',
      },
    } satisfies ServiceResponse<never>;
  }

  const { email, password } = validationResult.data;
  const db = useDb();

  try {
    // Find user by email
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      } satisfies ServiceResponse<never>;
    }

    const user = result[0]!;

    // Check if user signed up with OAuth
    if (user.provider !== 'email') {
      return {
        success: false,
        error: {
          code: 'OAUTH_ACCOUNT',
          message: `This account was registered using ${user.provider}. Please use ${user.provider} login.`,
        },
      } satisfies ServiceResponse<never>;
    }

    // Check if user has a password (should always be true for email accounts)
    if (!user.passwordHash) {
      return {
        success: false,
        error: {
          code: 'NO_PASSWORD',
          message: 'This account has no password set',
        },
      } satisfies ServiceResponse<never>;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      } satisfies ServiceResponse<never>;
    }

    // Create session
    const sessionId = await createSession(user.id);
    setSessionCookie(event, sessionId);

    // Build user response (exclude password hash)
    const userResponse: User = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role as 'admin' | 'editor' | 'user',
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      success: true,
      data: userResponse,
    } satisfies ServiceResponse<User>;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    console.error('[login] Error:', message);
    return {
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'Login failed. Please try again.',
      },
    } satisfies ServiceResponse<never>;
  }
});
