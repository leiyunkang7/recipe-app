/**
 * List User Category Subscriptions API Endpoint
 *
 * GET /api/subscriptions/categories
 * Response: { success: boolean, subscriptions?: CategorySubscription[], error?: { code, message } }
 */

import { defineEventHandler } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { categorySubscriptions } from '@recipe-app/database';
import { type ServiceResponse, successResponse } from '@recipe-app/shared-types';

type CategorySubscription = {
  id: string;
  userId: string;
  category: string;
  subscribed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default defineEventHandler(async (event) => {
  const user = (event.context as { user?: { id: string } })?.user;
  if (!user?.id) {
    return errorResponse('UNAUTHORIZED', '请先登录');
  }

  const db = useDb();

  try {
    const subscriptions = await db
      .select()
      .from(categorySubscriptions)
      .where(eq(categorySubscriptions.userId, user.id))
      .orderBy(categorySubscriptions.createdAt);

    return successResponse(
      subscriptions.map((sub) => ({
        id: sub.id,
        userId: sub.userId,
        category: sub.category,
        subscribed: sub.subscribed,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      })) as CategorySubscription[],
    );
  } catch (error) {
    console.error('[list-category-subscriptions] Error:', error);
    return errorResponse('FETCH_ERROR', '获取订阅列表失败');
  }
});
