/**
 * Subscribe to Category Updates API Endpoint
 *
 * POST /api/subscriptions/categories
 * Request body: { category: string }
 * Response: { success: boolean, subscription?: CategorySubscription, error?: { code, message } }
 */

import { defineEventHandler, readBody } from 'h3';
import { rateLimiters } from '../../../utils/rateLimit';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { categorySubscriptions } from '@recipe-app/database';
import { z } from 'zod';
import { type ServiceResponse, successResponse } from '@recipe-app/shared-types';

const SubscribeToCategorySchema = z.object({
  category: z.string().min(1, '分类名称不能为空').max(100),
});

type CategorySubscription = {
  id: string;
  userId: string;
  category: string;
  subscribed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default defineEventHandler(async (event) => {
  await rateLimiters.userAction(event);
  const body = await readBody(event);

  const validationResult = SubscribeToCategorySchema.safeParse(body);
  if (!validationResult.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      validationResult.error.errors.map((e) => e.message).join(', '),
    );
  }

  const { category } = validationResult.data;
  const normalizedCategory = category.toLowerCase().trim();

  const user = (event.context as { user?: { id: string } })?.user;
  if (!user?.id) {
    return errorResponse('UNAUTHORIZED', '请先登录');
  }

  const db = useDb();

  try {
    // Check if subscription already exists
    const existing = await db
      .select()
      .from(categorySubscriptions)
      .where(
        and(
          eq(categorySubscriptions.userId, user.id),
          eq(categorySubscriptions.category, normalizedCategory),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Reactivate if was unsubscribed
      const [updated] = await db
        .update(categorySubscriptions)
        .set({ subscribed: true, updatedAt: new Date() })
        .where(eq(categorySubscriptions.id, existing[0].id))
        .returning();

      return successResponse({
        id: updated.id,
        userId: updated.userId,
        category: updated.category,
        subscribed: updated.subscribed,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      } as CategorySubscription);
    }

    // Create new subscription
    const [newSub] = await db
      .insert(categorySubscriptions)
      .values({ userId: user.id, category: normalizedCategory, subscribed: true })
      .returning();

    return successResponse({
      id: newSub.id,
      userId: newSub.userId,
      category: newSub.category,
      subscribed: newSub.subscribed,
      createdAt: newSub.createdAt,
      updatedAt: newSub.updatedAt,
    } as CategorySubscription);
  } catch (error) {
    console.error('[subscribe-category] Error:', error);
    return errorResponse('SUBSCRIPTION_ERROR', '订阅失败，请稍后重试');
  }
});
