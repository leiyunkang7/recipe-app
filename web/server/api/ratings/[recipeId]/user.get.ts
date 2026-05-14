/**
 * Get User's Rating for a Recipe
 *
 * GET /api/ratings/[recipeId]/user
 * Returns the current user's rating for a recipe (if any)
 */

import { defineEventHandler, getRouterParam, getHeader } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { recipeRatings } from '@recipe-app/database';
import type { ServiceResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  try {
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

    // Get user ID from header (set by auth middleware)
    const userId = getHeader(event, 'x-user-id');

    if (!userId) {
      return {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User must be authenticated',
        },
      } satisfies ServiceResponse<never>;
    }

    const db = useDb();

    const [result] = await db
      .select({
        id: recipeRatings.id,
        score: recipeRatings.score,
      })
      .from(recipeRatings)
      .where(
        and(
          eq(recipeRatings.userId, userId),
          eq(recipeRatings.recipeId, recipeId)
        )
      )
      .limit(1);

    if (!result) {
      return {
        success: true,
        data: {
          score: 0,
        },
      } satisfies ServiceResponse<{ score: number }>;
    }

    return {
      success: true,
      data: {
        id: result.id,
        score: result.score,
      },
    } satisfies ServiceResponse<{ id: string; score: number }>;
  } catch (error) {
    console.error('[ratings] Error fetching user rating:', error);
    return {
      success: false,
      error: {
        code: 'ERROR',
        message: 'Failed to fetch user rating',
      },
    } satisfies ServiceResponse<never>;
  }
});
