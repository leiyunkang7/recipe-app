/**
 * Confirm Email Subscription API Endpoint
 *
 * GET /api/subscriptions/email/confirm?token=xxx
 * Response: { success: boolean, message?: string, error?: { code, message } }
 *
 * This endpoint confirms an email subscription using the verification token.
 */

import { defineEventHandler, getQuery } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { emailRecipeSubscriptions } from '@recipe-app/database';
import { type ServiceResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = query.token as string;

  if (!token) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Token is required',
      },
    } satisfies ServiceResponse<never>;
  }

  const db = useDb();

  try {
    // Find subscription by token
    const subscription = await db
      .select()
      .from(emailRecipeSubscriptions)
      .where(eq(emailRecipeSubscriptions.verificationToken, token))
      .limit(1);

    if (subscription.length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '无效的验证链接',
        },
      } satisfies ServiceResponse<never>;
    }

    const sub = subscription[0];

    // Check if already subscribed
    if (sub.subscribed) {
      return {
        success: true,
        data: { message: '您已经确认订阅了此食谱的更新通知' },
      } satisfies ServiceResponse<{ message: string }>;
    }

    // Check if token expired
    if (new Date() > sub.expiresAt) {
      return {
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: '验证链接已过期，请重新订阅',
        },
      } satisfies ServiceResponse<never>;
    }

    // Update subscription to verified
    await db
      .update(emailRecipeSubscriptions)
      .set({
        subscribed: true,
        updatedAt: new Date(),
      })
      .where(eq(emailRecipeSubscriptions.id, sub.id));

    return {
      success: true,
      data: { message: '订阅确认成功！您将收到此食谱的更新通知。' },
    } satisfies ServiceResponse<{ message: string }>;
  } catch (error) {
    console.error('[confirm-subscription] Error:', error);
    return {
      success: false,
      error: {
        code: 'CONFIRMATION_ERROR',
        message: '确认订阅失败，请稍后重试',
      },
    } satisfies ServiceResponse<never>;
  }
});
