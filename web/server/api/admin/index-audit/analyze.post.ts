import { defineEventHandler, readBody } from 'h3';
import { indexAuditor } from '@recipe-app/database';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { query } = body;

    if (!query || typeof query !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Query is required and must be a string',
      });
    }

    const plan = await indexAuditor.analyzeQuery(query);
    return { plan };
  } catch (error) {
    console.error('[Index Audit API] Error analyzing query:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to analyze query',
    });
  }
});
