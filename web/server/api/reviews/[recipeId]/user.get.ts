/**
 * Get Current User's Review for a Recipe
 *
 * GET /api/reviews/[recipeId]/user
 * Returns the current user's review for a specific recipe
 */

import { defineEventHandler, getRouterParam } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { recipeReviews } from '@recipe-app/database';
import { getCurrentUser } from '../../../utils/session';
import type { ServiceResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  try {
    const user = await getCurrentUser(event);

    if (!user) {
      return {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User must be authenticated',
        },
      } satisfies ServiceResponse<never>;
    }

    const recipeId = getRouterParam(event, 'recipeId');

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

    const [review] = await db
      .select({
        id: recipeReviews.id,
        recipeId: recipeReviews.recipeId,
        rating: recipeReviews.rating,
        content: recipeReviews.content,
        createdAt: recipeReviews.createdAt,
        updatedAt: recipeReviews.updatedAt,
      })
      .from(recipeReviews)
      .where(
        and(
          eq(recipeReviews.userId, user.id),
          eq(recipeReviews.recipeId, recipeId)
        )
      )
      .limit(1);

    if (!review) {
      return {
        success: true,
        data: null,
      } satisfies ServiceResponse<null>;
    }

    return {
      success: true,
      data: {
        id: review.id,
        recipeId: review.recipeId,
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt?.toISOString(),
        updatedAt: review.updatedAt?.toISOString(),
      },
    } satisfies ServiceResponse<{
      id: string;
      recipeId: string;
      rating: number | null;
      content: string;
      createdAt: string;
      updatedAt: string;
    } | null>;
  } catch (error) {
    console.error('[reviews] Error fetching user review:', error);
    return {
      success: false,
      error: {
        code: 'ERROR',
        message: 'Failed to fetch user review',
      },
    } satisfies ServiceResponse<never>;
  }
});
