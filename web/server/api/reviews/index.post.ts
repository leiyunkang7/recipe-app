/**
 * Submit or Update a Review
 *
 * POST /api/reviews
 * Body: { recipeId: string, content: string }
 * Submit or update a text review for a recipe
 */

import { defineEventHandler, readBody } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { recipeReviews } from '@recipe-app/database';
import { getCurrentUser } from '../../utils/session';
import { rateLimiters } from '../../utils/rateLimit';
import type { ServiceResponse } from '@recipe-app/shared-types';

interface ReviewBody {
  recipeId: string;
  content: string;
}

export default defineEventHandler(async (event) => {
  // Apply rate limiting for user actions (10 requests per minute)
  await rateLimiters.userAction(event);

  try {
    const user = await getCurrentUser(event);

    if (!user) {
      return {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User must be authenticated to write reviews',
        },
      } satisfies ServiceResponse<never>;
    }

    const body = await readBody<ReviewBody>(event);

    if (!body.recipeId || !body.content) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Recipe ID and content are required',
        },
      } satisfies ServiceResponse<never>;
    }

    const content = body.content.trim();
    if (content.length < 1 || content.length > 2000) {
      return {
        success: false,
        error: {
          code: 'INVALID_CONTENT',
          message: 'Review content must be between 1 and 2000 characters',
        },
      } satisfies ServiceResponse<never>;
    }

    const db = useDb();

    // Check if user already reviewed this recipe
    const existingReview = await db
      .select()
      .from(recipeReviews)
      .where(
        and(
          eq(recipeReviews.userId, user.id),
          eq(recipeReviews.recipeId, body.recipeId)
        )
      )
      .limit(1);

    let savedReview;

    if (existingReview.length > 0) {
      // Update existing review
      [savedReview] = await db
        .update(recipeReviews)
        .set({
          content,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(recipeReviews.userId, user.id),
            eq(recipeReviews.recipeId, body.recipeId)
          )
        )
        .returning();
    } else {
      // Insert new review
      [savedReview] = await db
        .insert(recipeReviews)
        .values({
          userId: user.id,
          recipeId: body.recipeId,
          content,
        })
        .returning();
    }

    return {
      success: true,
      data: {
        id: savedReview.id,
        recipeId: savedReview.recipeId,
        content: savedReview.content,
        createdAt: savedReview.createdAt?.toISOString(),
        updatedAt: savedReview.updatedAt?.toISOString(),
      },
    } satisfies ServiceResponse<{
      id: string;
      recipeId: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }>;
  } catch (error) {
    console.error('[reviews] Error submitting review:', error);
    return {
      success: false,
      error: {
        code: 'ERROR',
        message: 'Failed to submit review',
      },
    } satisfies ServiceResponse<never>;
  }
});
