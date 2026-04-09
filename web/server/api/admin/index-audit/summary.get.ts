import { defineEventHandler, getQuery } from 'h3';
import { indexAuditor } from '@recipe-app/database';

export default defineEventHandler(async (event) => {
  try {
    const summary = await indexAuditor.getAuditSummary();
    return summary;
  } catch (error) {
    console.error('[Index Audit API] Error fetching audit summary:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch index audit summary',
    });
  }
});
