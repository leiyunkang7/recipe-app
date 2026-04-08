/**
 * Delete a Review
 *
 * DELETE /api/reviews/[reviewId]
 * Deletes a review (only the author can delete their own review)
 */

import { defineEventHandler, getRouterParam } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { recipeReviews } from '@recipe-app/database';
import { getCurrentUser } from '../../../utils/session';
import { rateLimiters } from '../../../utils/rateLimit';
import type { ServiceResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  // Apply rate limiting for user actions
  await rateLimiters.userAction(event);

  try {
    const user = await getCurrentUser(event);

    if (!user) {
      return {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User must be authenticated to delete reviews',
        },
      } satisfies ServiceResponse<never>;
    }

    const reviewId = getRouterParam(event, 'reviewId');

    if (!reviewId) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Review ID is required',
        },
      } satisfies ServiceResponse<never>;
    }

    const db = useDb();

    // Check if review exists and belongs to the user
    const existingReview = await db
      .select()
      .from(recipeReviews)
      .where(eq(recipeReviews.id, reviewId))
      .limit(1);

    if (existingReview.length === 0) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found',
        },
      } satisfies ServiceResponse<never>;
    }

    if (existingReview[0].userId !== user.id) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own reviews',
        },
      } satisfies ServiceResponse<never>;
    }

    // Delete the review
    await db
      .delete(recipeReviews)
      .where(eq(recipeReviews.id, reviewId));

    return {
      success: true,
      data: {
        deleted: true,
      },
    } satisfies ServiceResponse<{ deleted: boolean }>;
  } catch (error) {
    console.error('[reviews] Error deleting review:', error);
    return {
      success: false,
      error: {
        code: 'ERROR',
        message: 'Failed to delete review',
      },
    } satisfies ServiceResponse<never>;
  }
});
