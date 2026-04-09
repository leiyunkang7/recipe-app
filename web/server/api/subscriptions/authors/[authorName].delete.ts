/**
 * Unsubscribe from Author API Endpoint
 *
 * DELETE /api/subscriptions/authors/[authorName]
 * Response: { success: boolean, message: string, error?: { code, message } }
 */

import { defineEventHandler } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { authorSubscriptions } from '@recipe-app/database';
import { type ServiceResponse, successResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const user = (event.context as { user?: { id: string } })?.user;
  if (!user?.id) {
    return errorResponse('UNAUTHORIZED', '请先登录');
  }

  const authorName = getRouterParam(event, 'authorName');
  if (!authorName) {
    return errorResponse('VALIDATION_ERROR', '作者名称不能为空');
  }

  const db = useDb();

  try {
    // Find the subscription
    const existing = await db
      .select()
      .from(authorSubscriptions)
      .where(
        and(
          eq(authorSubscriptions.userId, user.id),
          eq(authorSubscriptions.authorName, authorName)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return errorResponse('NOT_FOUND', '未找到该作者订阅');
    }

    // Update subscription to unsubscribed
    await db
      .update(authorSubscriptions)
      .set({ subscribed: false, updatedAt: new Date() })
      .where(eq(authorSubscriptions.userId, existing[0].id));

    return successResponse({ 
      message: '已取消订阅作者: ' + authorName 
    });
  } catch (error) {
    console.error('[unsubscribe-author] Error:', error);
    return errorResponse('UNSUBSCRIBE_ERROR', '取消订阅失败');
  }
});