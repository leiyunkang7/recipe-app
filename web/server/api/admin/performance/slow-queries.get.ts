/**
 * Slow Queries API Endpoint
 *
 * GET /api/admin/performance/slow-queries
 * Query params: threshold (optional, default from config)
 * Returns slow queries above the threshold
 */

import { defineEventHandler, getQuery } from 'h3';
import { performanceTracker } from '@recipe-app/database';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const thresholdMs = query.threshold ? parseInt(query.threshold as string) : undefined;

    const slowQueries = performanceTracker.getSlowQueries(thresholdMs);

    return {
      success: true,
      data: {
        thresholdMs: thresholdMs ?? 100,
        count: slowQueries.length,
        queries: slowQueries,
      },
    };
  } catch (error) {
    console.error('[Performance API] Error fetching slow queries:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch slow queries',
    });
  }
});
