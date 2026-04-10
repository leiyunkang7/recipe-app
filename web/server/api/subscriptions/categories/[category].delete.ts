/**
 * Unsubscribe from Category API Endpoint
 *
 * DELETE /api/subscriptions/categories/[category]
 * Response: { success: boolean, message: string, error?: { code, message } }
 */

import { defineEventHandler } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { categorySubscriptions } from '@recipe-app/database';

export default defineEventHandler(async (event) => {
  const user = (event.context as { user?: { id: string } })?.user;
  if (!user?.id) {
    return errorResponse('UNAUTHORIZED', '请先登录');
  }

  const category = getRouterParam(event, 'category');
  if (!category) {
    return errorResponse('VALIDATION_ERROR', '分类名称不能为空');
  }

  const db = useDb();

  try {
    // Find the subscription
    const existing = await db
      .select()
      .from(categorySubscriptions)
      .where(
        and(
          eq(categorySubscriptions.userId, user.id),
          eq(categorySubscriptions.category, category)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return errorResponse('NOT_FOUND', '未找到该分类订阅');
    }

    // Update subscription to unsubscribed
    await db
      .update(categorySubscriptions)
      .set({ subscribed: false, updatedAt: new Date() })
      .where(eq(categorySubscriptions.id, existing[0].id));

    return successResponse({ 
      message: '已取消订阅分类: ' + category 
    });
  } catch (error) {
    console.error('[unsubscribe-category] Error:', error);
    return errorResponse('UNSUBSCRIBE_ERROR', '取消订阅失败');
  }
});