import { defineEventHandler } from 'h3';
import { useDb } from '../../utils/db';

/**
 * API Version Info Endpoint
 * 
 * Returns information about the current API version and supported versions.
 * This endpoint helps clients discover API capabilities.
 */
export default defineEventHandler(async (_event) => {
  const db = useDb();
  
  // Get active API versions from database
  let versions: Array<{version: string; is_active: boolean; deprecation_date: string | null}> = [];
  try {
    const result = await db.query(`
      SELECT version, is_active, deprecation_date 
      FROM api_versions 
      ORDER BY version
    `);
    versions = result as typeof result;
  } catch {
    // Fallback if table doesn't exist yet
    versions = [{ version: 'v1', is_active: true, deprecation_date: null }];
  }

  const currentVersion = 'v1';
  const currentVersionInfo = versions.find(v => v.version === currentVersion);
  
  return {
    api: {
      name: 'Recipe App API',
      version: currentVersion,
      status: currentVersionInfo?.is_active ? 'active' : 'deprecated',
      deprecation_date: currentVersionInfo?.deprecation_date,
    },
    supported_versions: versions.map(v => ({
      version: v.version,
      status: v.is_active ? 'active' : 'deprecated',
      deprecation_date: v.deprecation_date,
    })),
    documentation: '/api/v1/docs',
    endpoints: {
      recipes: '/api/v1/recipes',
      search: '/api/v1/search',
      categories: '/api/v1/categories',
      cuisines: '/api/v1/cuisines',
      changelog: '/api/v1/changelog',
      docs: '/api/v1/docs',
    },
  };
});
