/**
 * API Version Migration Runner
 *
 * Utility to track and run migrations for specific API versions.
 * This ensures backwards compatibility and proper version management.
 */

import { useDb } from '../utils/db';

export interface MigrationRecord {
  version: string;
  migrationName: string;
  appliedAt: Date;
  rollbackSql?: string;
}

export interface ApiVersionInfo {
  version: string;
  isActive: boolean;
  deprecationDate: string | null;
  sunsetDate: string | null;
  changelogUrl: string | null;
  docsUrl: string | null;
}

/**
 * Get all registered API versions
 */
export async function getApiVersions(): Promise<ApiVersionInfo[]> {
  const db = useDb();
  const result = await db.query('SELECT * FROM api_versions ORDER BY version');
  return (result as any[]).map(row => ({
    version: row.version,
    isActive: row.is_active,
    deprecationDate: row.deprecation_date,
    sunsetDate: row.sunset_date,
    changelogUrl: row.changelog_url,
    docsUrl: row.docs_url,
  }));
}

/**
 * Get migrations for a specific API version
 */
export async function getVersionMigrations(version: string): Promise<MigrationRecord[]> {
  const db = useDb();
  const result = await db.query(
    'SELECT * FROM api_version_migrations WHERE version = $1 ORDER BY applied_at DESC',
    [version]
  );
  return (result as any[]).map(row => ({
    version: row.version,
    migrationName: row.migration_name,
    appliedAt: row.applied_at,
    rollbackSql: row.rollback_sql,
  }));
}

/**
 * Record a migration as applied
 */
export async function recordMigration(
  version: string,
  migrationName: string,
  rollbackSql?: string
): Promise<void> {
  const db = useDb();
  await db.query(
    `INSERT INTO api_version_migrations (version, migration_name, rollback_sql)
     VALUES ($1, $2, $3)
     ON CONFLICT (version, migration_name) DO NOTHING`,
    [version, migrationName, rollbackSql || null]
  );
}

/**
 * Check if a migration has been applied
 */
export async function isMigrationApplied(
  version: string,
  migrationName: string
): Promise<boolean> {
  const db = useDb();
  const result = await db.query(
    'SELECT 1 FROM api_version_migrations WHERE version = $1 AND migration_name = $2',
    [version, migrationName]
  );
  return (result as any[]).length > 0;
}

/**
 * Get the current active API version
 */
export async function getCurrentVersion(): Promise<string> {
  const db = useDb();
  const result = await db.query(
    'SELECT version FROM api_versions WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
  );
  if ((result as any[]).length === 0) {
    return 'v1'; // Fallback default
  }
  return (result as any[])[0].version;
}

/**
 * Check if a version is deprecated
 */
export async function isVersionDeprecated(version: string): Promise<boolean> {
  const db = useDb();
  const result = await db.query(
    'SELECT is_active, deprecation_date FROM api_versions WHERE version = $1',
    [version]
  );
  if ((result as any[]).length === 0) {
    return false;
  }
  const row = (result as any[])[0];
  return !row.is_active || (row.deprecation_date !== null);
}
