/**
 * Unsubscribe from Email Notifications API Endpoint (GET version)
 *
 * GET /api/subscriptions/email/unsubscribe?token=xxx
 * Query params: { token: string }
 * Response: { success: boolean, message?: string, error?: { code, message } }
 *
 * This endpoint handles unsubscribe links in notification emails.
 * It allows users to unsubscribe using their unique token via GET request.
 */

import { defineEventHandler, getQuery } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { emailRecipeSubscriptions } from '@recipe-app/database';

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
    };
  }

  const db = useDb();

  try {
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
          message: '无效的退订链接',
        },
      };
    }

    await db
      .delete(emailRecipeSubscriptions)
      .where(eq(emailRecipeSubscriptions.id, subscription[0].id));

    return {
      success: true,
      data: { message: '已成功退订，您将不会再收到此食谱的更新通知。' },
    };
  } catch (error) {
    console.error('[unsubscribe-email-get] Error:', error);
    return {
      success: false,
      error: {
        code: 'UNSUBSCRIBE_ERROR',
        message: '退订失败，请稍后重试',
      },
    };
  }
});
