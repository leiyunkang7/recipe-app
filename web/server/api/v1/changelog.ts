import { defineEventHandler, createError } from 'h3';
import { useDb } from '../../utils/db';

/**
 * API v1 Changelog Endpoint
 *
 * Returns the changelog for API v1
 */
export default defineEventHandler(async (event) => {
  const db = useDb();

  let migrations: Array<{migration_name: string; applied_at: Date}> = [];
  try {
    const result = await db.query(
      'SELECT migration_name, applied_at FROM api_version_migrations WHERE version = $1 ORDER BY applied_at DESC',
      ['v1']
    );
    migrations = result as typeof result;
  } catch {
    // Table might not exist yet
  }

  const changelog = {
    version: 'v1',
    last_updated: new Date().toISOString(),
    changes: [
      {
        date: '2026-04-07',
        type: 'feature',
        description: 'Initial API v1 release with recipe CRUD, search, and filtering',
      },
      {
        date: '2026-04-07',
        type: 'feature',
        description: 'Added favorites and ratings support',
      },
      {
        date: '2026-04-07',
        type: 'feature',
        description: 'Added recipe stats endpoint (/api/v1/recipes/:id/stats)',
      },
    ],
    migrations: migrations.map(m => ({
      name: m.migration_name,
      applied_at: m.applied_at instanceof Date ? m.applied_at.toISOString() : m.applied_at,
    })),
  };

  return changelog;
});
