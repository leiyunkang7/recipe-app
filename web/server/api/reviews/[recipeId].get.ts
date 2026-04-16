/**
 * Get Reviews for a Recipe
 *
 * GET /api/reviews/[recipeId]
 * Returns paginated reviews for a recipe with user info
 */

import { rateLimiters } from '../../utils/rateLimit';
import { defineEventHandler, getRouterParam, getQuery } from 'h3';
import { eq, count, desc } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { recipeReviews, users } from '@recipe-app/database';
import type { ServiceResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  // Rate limiting for reviews listing
  await rateLimiters.standard(event);

  try {
    const recipeId = getRouterParam(event, 'recipeId');
    const query = getQuery(event);
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 10));
    const offset = (page - 1) * limit;

    if (!recipeId) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Recipe ID is required',
        },
      } satisfies ServiceResponse<never>;
    }

    const db = useDb();

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(recipeReviews)
      .where(eq(recipeReviews.recipeId, recipeId));

    // Get reviews with user info using join
    const reviews = await db
      .select({
        id: recipeReviews.id,
        recipeId: recipeReviews.recipeId,
        rating: recipeReviews.rating,
        content: recipeReviews.content,
        createdAt: recipeReviews.createdAt,
        updatedAt: recipeReviews.updatedAt,
        userId: recipeReviews.userId,
        userName: users.name,
        userAvatar: users.avatarUrl,
      })
      .from(recipeReviews)
      .leftJoin(users, eq(recipeReviews.userId, users.id))
      .where(eq(recipeReviews.recipeId, recipeId))
      .orderBy(desc(recipeReviews.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform results
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      recipeId: review.recipeId,
      rating: review.rating,
      content: review.content,
      createdAt: review.createdAt?.toISOString(),
      updatedAt: review.updatedAt?.toISOString(),
      user: {
        id: review.userId,
        name: review.userName || 'Anonymous',
        avatarUrl: review.userAvatar,
      },
    }));

    return {
      success: true,
      data: {
        reviews: formattedReviews,
        pagination: {
          page,
          limit,
          total: Number(countResult?.count) || 0,
          totalPages: Math.ceil((Number(countResult?.count) || 0) / limit),
        },
      },
    } satisfies ServiceResponse<{
      reviews: Array<{
        id: string;
        recipeId: string;
        rating: number | null;
        content: string;
        createdAt: string;
        updatedAt: string;
        user: { id: string; name: string; avatarUrl: string | null };
      }>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>;
  } catch (error) {
    console.error('[reviews] Error fetching reviews:', error);
    return {
      success: false,
      error: {
        code: 'ERROR',
        message: 'Failed to fetch reviews',
      },
    } satisfies ServiceResponse<never>;
  }
});
