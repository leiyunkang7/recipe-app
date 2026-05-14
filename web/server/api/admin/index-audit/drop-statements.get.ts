import { defineEventHandler } from 'h3';
import { indexAuditor } from '@recipe-app/database';

export default defineEventHandler(async () => {
  try {
    const statements = await indexAuditor.generateDropStatements();
    return { statements };
  } catch (error) {
    console.error('[Index Audit API] Error generating drop statements:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate drop statements',
    });
  }
});
