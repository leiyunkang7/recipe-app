/**
 * Subscribe to Author Updates API Endpoint
 *
 * POST /api/subscriptions/authors
 * Request body: { authorName: string }
 * Response: { success: boolean, subscription?: AuthorSubscription, error?: { code, message } }
 */

import { defineEventHandler, readBody } from 'h3';
import { rateLimiters } from '../../../utils/rateLimit';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { authorSubscriptions } from '@recipe-app/database';
import { z } from 'zod';
import { successResponse } from '@recipe-app/shared-types';

const SubscribeToAuthorSchema = z.object({
  authorName: z.string().min(1, '作者名称不能为空').max(100),
});

type AuthorSubscription = {
  id: string;
  userId: string;
  authorName: string;
  subscribed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default defineEventHandler(async (event) => {
  await rateLimiters.userAction(event);
  const body = await readBody(event);

  const validationResult = SubscribeToAuthorSchema.safeParse(body);
  if (!validationResult.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      validationResult.error.errors.map((e) => e.message).join(', '),
    );
  }

  const { authorName } = validationResult.data;
  const normalizedAuthorName = authorName.trim();

  const user = (event.context as { user?: { id: string } })?.user;
  if (!user?.id) {
    return errorResponse('UNAUTHORIZED', '请先登录');
  }

  const db = useDb();

  try {
    // Check if subscription already exists
    const existing = await db
      .select()
      .from(authorSubscriptions)
      .where(
        and(
          eq(authorSubscriptions.userId, user.id),
          eq(authorSubscriptions.authorName, normalizedAuthorName),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Reactivate if was unsubscribed
      const [updated] = await db
        .update(authorSubscriptions)
        .set({ subscribed: true, updatedAt: new Date() })
        .where(eq(authorSubscriptions.id, existing[0].id))
        .returning();

      return successResponse({
        id: updated.id,
        userId: updated.userId,
        authorName: updated.authorName,
        subscribed: updated.subscribed,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      } as AuthorSubscription);
    }

    // Create new subscription
    const [newSub] = await db
      .insert(authorSubscriptions)
      .values({ userId: user.id, authorName: normalizedAuthorName, subscribed: true })
      .returning();

    return successResponse({
      id: newSub.id,
      userId: newSub.userId,
      authorName: newSub.authorName,
      subscribed: newSub.subscribed,
      createdAt: newSub.createdAt,
      updatedAt: newSub.updatedAt,
    } as AuthorSubscription);
  } catch (error) {
    console.error('[subscribe-author] Error:', error);
    return errorResponse('SUBSCRIPTION_ERROR', '订阅失败，请稍后重试');
  }
});