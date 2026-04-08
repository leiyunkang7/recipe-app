/**
 * Unsubscribe from Email Notifications API Endpoint
 *
 * POST /api/subscriptions/email/unsubscribe
 * Request body: { token: string }
 * Response: { success: boolean, message?: string, error?: { code, message } }
 *
 * This endpoint allows users to unsubscribe using their unique token.
 */

import { defineEventHandler, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { emailRecipeSubscriptions } from '@recipe-app/database';
import { UnsubscribeByTokenSchema, type ServiceResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate request body
  const validationResult = UnsubscribeByTokenSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error.errors.map((e) => e.message).join(', '),
      },
    } satisfies ServiceResponse<never>;
  }

  const { token } = validationResult.data;
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
          message: '无效的退订链接',
        },
      } satisfies ServiceResponse<never>;
    }

    // Delete the subscription
    await db
      .delete(emailRecipeSubscriptions)
      .where(eq(emailRecipeSubscriptions.id, subscription[0].id));

    return {
      success: true,
      data: { message: '已成功退订，您将不会再收到此食谱的更新通知。' },
    } satisfies ServiceResponse<{ message: string }>;
  } catch (error) {
    console.error('[unsubscribe-email] Error:', error);
    return {
      success: false,
      error: {
        code: 'UNSUBSCRIBE_ERROR',
        message: '退订失败，请稍后重试',
      },
    } satisfies ServiceResponse<never>;
  }
});
