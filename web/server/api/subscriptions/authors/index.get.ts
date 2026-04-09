/**
 * List User Author Subscriptions API Endpoint
 *
 * GET /api/subscriptions/authors
 * Response: { success: boolean, subscriptions?: AuthorSubscription[], error?: { code, message } }
 */

import { defineEventHandler } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { authorSubscriptions } from '@recipe-app/database';
import { type ServiceResponse, successResponse } from '@recipe-app/shared-types';

type AuthorSubscription = {
  id: string;
  userId: string;
  authorName: string;
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
      .from(authorSubscriptions)
      .where(eq(authorSubscriptions.userId, user.id))
      .orderBy(authorSubscriptions.createdAt);

    return successResponse(
      subscriptions.map((sub) => ({
        id: sub.id,
        userId: sub.userId,
        authorName: sub.authorName,
        subscribed: sub.subscribed,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      })) as AuthorSubscription[],
    );
  } catch (error) {
    console.error('[list-author-subscriptions] Error:', error);
    return errorResponse('FETCH_ERROR', '获取订阅列表失败');
  }
});