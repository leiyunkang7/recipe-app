/**
 * User Registration API Endpoint
 *
 * POST /api/auth/register
 * Request body: { email, username, password, verificationCode }
 * Response: { success: boolean, user?: User, error?: { code: string, message: string } }
 */

import { defineEventHandler, readBody } from 'h3';
import { eq, and, gt, desc } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { users, emailVerifications, favoriteFolders } from '@recipe-app/database';
import { RegisterUserSchema, type User, type ServiceResponse } from '@recipe-app/shared-types';
import { rateLimiters } from '../../utils/rateLimit';

// bcryptjs for password hashing
import bcrypt from 'bcryptjs';

// Maximum verification attempts
const MAX_VERIFICATION_ATTEMPTS = 5;
// bcrypt cost factor (12 is recommended for production)
const BCRYPT_COST_FACTOR = 12;

// Default folders to create for new users
const DEFAULT_FOLDERS = [
  { name: '我的收藏', color: '#F97316' },
  { name: '想做的菜', color: '#10B981' },
];

export default defineEventHandler(async (event) => {
  // Apply rate limiting for registration (strict: 3 per hour)
  await rateLimiters.registration(event);

  const body = await readBody(event);

  // Validate request body
  const validationResult = RegisterUserSchema.safeParse(body);
  if (!validationResult.success) {
    const errors = validationResult.error.errors.map((e) => e.message).join(', ');
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Validation failed: ${errors}`,
      },
    } satisfies ServiceResponse<never>;
  }

  const { email, username, password, verificationCode } = validationResult.data;
  const db = useDb();

  try {
    // Step 1: Check if email is already registered
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail.length > 0) {
      return {
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email is already registered',
        },
      } satisfies ServiceResponse<never>;
    }

    // Step 2: Check if username is already taken
    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUsername.length > 0) {
      return {
        success: false,
        error: {
          code: 'USERNAME_EXISTS',
          message: 'Username is already taken',
        },
      } satisfies ServiceResponse<never>;
    }

    // Step 3 & 4: Verify the verification code
    const verificationRecord = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, email),
          gt(emailVerifications.expiresAt, new Date())
        )
      )
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);

    if (verificationRecord.length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Verification code has expired or does not exist. Please request a new code.',
        },
      } satisfies ServiceResponse<never>;
    }

    const record = verificationRecord[0];

    // Check if too many attempts
    if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      return {
        success: false,
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message: 'Too many verification attempts. Please request a new code.',
        },
      } satisfies ServiceResponse<never>;
    }

    // Check if code matches
    if (record.code !== verificationCode) {
      // Increment attempts
      await db
        .update(emailVerifications)
        .set({ attempts: record.attempts + 1 })
        .where(eq(emailVerifications.id, record.id));

      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - record.attempts - 1;
      return {
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        },
      } satisfies ServiceResponse<never>;
    }

    // Step 5: Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    // Step 6 & 7: Create user and default folders in a transaction
    const result = await db.transaction(async (tx) => {
      // Create user
      const [newUser] = await tx
        .insert(users)
        .values({
          email,
          username,
          passwordHash,
          displayName: username, // Default display name to username
          role: 'user',
          emailVerified: true, // Email is verified since they provided correct code
          emailVerifiedAt: new Date(),
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

    // Delete used verification code
    await db.delete(emailVerifications).where(eq(emailVerifications.id, result.id));

    // Build user response (exclude password hash)
    const userResponse: User = {
      id: result.id,
      email: result.email,
      username: result.username,
      displayName: result.displayName,
      avatarUrl: result.avatarUrl,
      bio: result.bio,
      role: result.role as 'admin' | 'editor' | 'user',
      emailVerified: result.emailVerified,
      emailVerifiedAt: result.emailVerifiedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };

    return {
      success: true,
      data: userResponse,
    } satisfies ServiceResponse<User>;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    console.error('[register] Error:', message);
    return {
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Registration failed. Please try again.',
      },
    } satisfies ServiceResponse<never>;
  }
});
