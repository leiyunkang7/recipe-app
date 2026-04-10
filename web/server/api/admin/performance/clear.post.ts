/**
 * Clear Performance Stats API Endpoint
 *
 * POST /api/admin/performance/clear
 * Clears the performance tracker records
 */

import { defineEventHandler } from 'h3';
import { performanceTracker } from '@recipe-app/database';

export default defineEventHandler(async (_event) => {
  try {
    performanceTracker.clear();

    return {
      success: true,
      message: 'Performance stats cleared',
    };
  } catch (error) {
    console.error('[Performance API] Error clearing performance stats:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to clear performance stats',
    });
  }
});
