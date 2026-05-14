/**
 * Send Verification Code API Endpoint
 *
 * POST /api/auth/send-verification
 * Request body: { email: string }
 * Response: { success: boolean, message?: string }
 */

import { defineEventHandler, readBody } from 'h3';
import { eq, and, gt, desc } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { EmailService, generateVerificationCode } from '../../utils/email';
import { users, emailVerifications } from '@recipe-app/database';
import { SendVerificationCodeSchema } from '@recipe-app/shared-types';

// Verification code validity: 10 minutes
const VERIFICATION_CODE_EXPIRY_MINUTES = 10;
// Rate limiting: prevent sending too many codes
const RATE_LIMIT_SECONDS = 60;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate request body
  const validationResult = SendVerificationCodeSchema.safeParse(body);
  if (!validationResult.success) {
    const errors = validationResult.error.errors.map((e) => e.message).join(', ');
    return {
      success: false,
      message: `Validation failed: ${errors}`,
    };
  }

  const { email } = validationResult.data;
  const db = useDb();

  try {
    // Check if email is already registered
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return {
        success: false,
        message: 'Email is already registered',
      };
    }

    // Check rate limit - don't allow sending too many codes
    const recentVerification = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, email),
          gt(emailVerifications.createdAt, new Date(Date.now() - RATE_LIMIT_SECONDS * 1000))
        )
      )
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);

    if (recentVerification.length > 0) {
      const secondsWait = Math.ceil(
        RATE_LIMIT_SECONDS -
          (Date.now() - recentVerification[0].createdAt.getTime()) / 1000
      );
      return {
        success: false,
        message: `Please wait ${secondsWait} seconds before requesting a new code`,
      };
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);

    // Save verification code to database
    await db.insert(emailVerifications).values({
      email,
      code,
      expiresAt,
      attempts: 0,
    });

    // Send verification code via email
    const emailResult = await EmailService.sendVerificationCode(email, code);

    if (!emailResult.success) {
      return {
        success: false,
        message: emailResult.message || 'Failed to send verification code',
      };
    }

    return {
      success: true,
      message: 'Verification code sent successfully',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send verification code';
    console.error('[send-verification] Error:', message);
    return {
      success: false,
      message: 'Failed to send verification code',
    };
  }
});
