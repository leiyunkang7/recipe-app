/**
 * Unsubscribe from Recipe Updates API Endpoint
 *
 * DELETE /api/subscriptions/recipes/:recipeId
 * Response: { success: boolean, error?: { code, message } }
 */

import { defineEventHandler, getRouterParam } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { recipeSubscriptions } from '@recipe-app/database';
import { type ServiceResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const recipeId = getRouterParam(event, 'recipeId');

  if (!recipeId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '食谱ID不能为空',
      },
    } satisfies ServiceResponse<never>;
  }

  // Get user from session (assuming auth middleware sets user)
  const user = (event.context as { user?: { id: string } })?.user;
  if (!user?.id) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '请先登录',
      },
    } satisfies ServiceResponse<never>;
  }

  const db = useDb();

  try {
    // Update subscription to unsubscribed instead of deleting
    await db
      .update(recipeSubscriptions)
      .set({
        subscribed: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(recipeSubscriptions.userId, user.id),
          eq(recipeSubscriptions.recipeId, recipeId)
        )
      );

    return {
      success: true,
      data: { message: '已取消订阅' },
    } satisfies ServiceResponse<{ message: string }>;
  } catch (error) {
    console.error('[unsubscribe-recipe] Error:', error);
    return {
      success: false,
      error: {
        code: 'UNSUBSCRIPTION_ERROR',
        message: '取消订阅失败，请稍后重试',
      },
    } satisfies ServiceResponse<never>;
  }
});
