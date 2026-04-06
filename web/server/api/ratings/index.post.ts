/**
 * Submit or Update a Rating
 *
 * POST /api/ratings
 * Body: { recipeId: string, score: number }
 * Submit or update a rating for a recipe
 */

import { defineEventHandler, readBody } from 'h3';
import { eq, and, count, sql } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { recipeRatings } from '@recipe-app/database';
import { getCurrentUser } from '../../utils/session';
import type { ServiceResponse } from '@recipe-app/shared-types';

interface RatingBody {
  recipeId: string;
  score: number;
}

export default defineEventHandler(async (event) => {
  try {
    const user = await getCurrentUser(event);

    if (!user) {
      return {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User must be authenticated to rate recipes',
        },
      } satisfies ServiceResponse<never>;
    }

    const body = await readBody<RatingBody>(event);

    if (!body.recipeId || !body.score) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Recipe ID and score are required',
        },
      } satisfies ServiceResponse<never>;
    }

    const score = Number(body.score);
    if (score < 1 || score > 5 || !Number.isInteger(score)) {
      return {
        success: false,
        error: {
          code: 'INVALID_SCORE',
          message: 'Score must be an integer between 1 and 5',
        },
      } satisfies ServiceResponse<never>;
    }

    const db = useDb();

    // Check if user already rated this recipe
    const existingRating = await db
      .select()
      .from(recipeRatings)
      .where(
        and(
          eq(recipeRatings.userId, user.id),
          eq(recipeRatings.recipeId, body.recipeId)
        )
      )
      .limit(1);

    let savedRating;

    if (existingRating.length > 0) {
      // Update existing rating
      [savedRating] = await db
        .update(recipeRatings)
        .set({
          score,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(recipeRatings.userId, user.id),
            eq(recipeRatings.recipeId, body.recipeId)
          )
        )
        .returning();
    } else {
      // Insert new rating
      [savedRating] = await db
        .insert(recipeRatings)
        .values({
          userId: user.id,
          recipeId: body.recipeId,
          score,
        })
        .returning();
    }

    // Get updated stats
    const [stats] = await db
      .select({
        avg: sql<number>`round(avg(${recipeRatings.score})::numeric, 1)`,
        count: count(),
      })
      .from(recipeRatings)
      .where(eq(recipeRatings.recipeId, body.recipeId));

    return {
      success: true,
      data: {
        id: savedRating.id,
        recipeId: savedRating.recipeId,
        score: savedRating.score,
        averageRating: stats?.avg ?? 0,
        ratingCount: Number(stats?.count) ?? 0,
      },
    } satisfies ServiceResponse<{
      id: string;
      recipeId: string;
      score: number;
      averageRating: number;
      ratingCount: number;
    }>;
  } catch (error) {
    console.error('[ratings] Error submitting rating:', error);
    return {
      success: false,
      error: {
        code: 'ERROR',
        message: 'Failed to submit rating',
      },
    } satisfies ServiceResponse<never>;
  }
});
