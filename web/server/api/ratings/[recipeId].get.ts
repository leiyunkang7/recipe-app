/**
 * Get Rating Stats for a Recipe
 *
 * GET /api/ratings/[recipeId]
 * Returns average rating and count for a recipe
 */

import { rateLimiters } from '../../utils/rateLimit';
import { defineEventHandler, getRouterParam } from 'h3';
import { eq, count, sql } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { recipeRatings } from '@recipe-app/database';
import type { ServiceResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  // Rate limiting for ratings listing
  await rateLimiters.standard(event);
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

    const db = useDb();

    const [result] = await db
      .select({
        avg: sql<number>`round(avg(${recipeRatings.score})::numeric, 1)`,
        count: count(),
      })
      .from(recipeRatings)
      .where(eq(recipeRatings.recipeId, recipeId));

    return {
      success: true,
      data: {
        averageRating: result?.avg ?? 0,
        ratingCount: Number(result?.count) ?? 0,
      },
    } satisfies ServiceResponse<{ averageRating: number; ratingCount: number }>;
  } catch (error) {
    console.error('[ratings] Error fetching rating stats:', error);
    return {
      success: false,
      error: {
        code: 'ERROR',
        message: 'Failed to fetch rating stats',
      },
    } satisfies ServiceResponse<never>;
  }
});
