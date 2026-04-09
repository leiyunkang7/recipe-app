/**
 * Query Performance Stats API Endpoint
 *
 * GET /api/admin/performance/stats
 * Returns query performance statistics collected by the performance tracker
 */

import { defineEventHandler } from 'h3';
import { performanceTracker } from '@recipe-app/database';

export default defineEventHandler(async (event) => {
  try {
    const summary = performanceTracker.getSummary();
    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    console.error('[Performance API] Error fetching performance stats:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch performance stats',
    });
  }
});
