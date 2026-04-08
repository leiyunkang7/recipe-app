/**
 * API Version Migration Service
 *
 * Tracks data migrations per API version and provides version compatibility checks.
 */

import { useDb } from "../utils/db";

export interface ApiVersionInfo {
  version: string;
  isActive: boolean;
  deprecationDate: string | null;
  migrations: string[];
}

export interface MigrationRecord {
  version: string;
  migrationName: string;
  appliedAt: Date;
}

/**
 * Get all API versions with their migration status
 */
export async function getApiVersions(): Promise<ApiVersionInfo[]> {
  const db = useDb();

  // Get all versions
  let versions: Array<{ version: string; is_active: boolean; deprecation_date: string | null }> = [];
  try {
    const result = await db.query(`
      SELECT version, is_active, deprecation_date
      FROM api_versions
      ORDER BY version
    `);
    versions = result as typeof result;
  } catch {
    versions = [{ version: "v1", is_active: true, deprecation_date: null }];
  }

  // Get migrations per version
  let migrations: Array<{ version: string; migration_name: string }> = [];
  try {
    const result = await db.query(`
      SELECT version, migration_name
      FROM api_version_migrations
      ORDER BY version, migration_name
    `);
    migrations = result as typeof result;
  } catch {
    // Table might not exist
  }

  // Group migrations by version
  const migrationMap = new Map<string, string[]>();
  for (const m of migrations) {
    if (!migrationMap.has(m.version)) {
      migrationMap.set(m.version, []);
    }
    migrationMap.get(m.version)!.push(m.migration_name);
  }

  return versions.map((v) => ({
    version: v.version,
    isActive: v.is_active,
    deprecationDate: v.deprecation_date,
    migrations: migrationMap.get(v.version) || [],
  }));
}

/**
 * Get migrations for a specific API version
 */
export async function getVersionMigrations(version: string): Promise<MigrationRecord[]> {
  const db = useDb();

  try {
    const result = await db.query(
      `SELECT version, migration_name, applied_at
       FROM api_version_migrations
       WHERE version = $1
       ORDER BY applied_at`,
      [version]
    );
    return (result as Array<{ version: string; migration_name: string; applied_at: Date }>).map((r) => ({
      version: r.version,
      migrationName: r.migration_name,
      appliedAt: r.applied_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Check if a version supports a specific feature
 */
export async function versionSupportsFeature(
  version: string,
  featureTag: string
): Promise<boolean> {
  const versions = await getApiVersions();
  const versionInfo = versions.find((v) => v.version === version);

  if (!versionInfo || !versionInfo.isActive) {
    return false;
  }

  // Define feature requirements per version
  const featureRequirements: Record<string, string[]> = {
    v1: ["basic_recipes", "search", "categories", "cuisines"],
    // Future versions can add more features
  };

  const requirements = featureRequirements[version];
  if (!requirements) {
    return false;
  }

  return requirements.includes(featureTag);
}

/**
 * Get the latest active API version
 */
export async function getLatestActiveVersion(): Promise<string> {
  const versions = await getApiVersions();
  const activeVersions = versions.filter((v) => v.isActive);

  if (activeVersions.length === 0) {
    return "v1";
  }

  // Sort by version number descending
  activeVersions.sort((a, b) => {
    const numA = parseInt(a.version.replace("v", ""), 10);
    const numB = parseInt(b.version.replace("v", ""), 10);
    return numB - numA;
  });

  return activeVersions[0].version;
}

/**
 * Register a new API version
 */
export async function registerApiVersion(
  version: string,
  isActive: boolean = true,
  deprecationDate: string | null = null
): Promise<void> {
  const db = useDb();

  await db.query(
    `INSERT INTO api_versions (version, is_active, deprecation_date)
     VALUES ($1, $2, $3)
     ON CONFLICT (version) DO UPDATE SET
       is_active = EXCLUDED.is_active,
       deprecation_date = EXCLUDED.deprecation_date`,
    [version, isActive, deprecationDate]
  );
}

/**
 * Deprecate an API version
 */
export async function deprecateVersion(version: string, deprecationDate: string): Promise<void> {
  const db = useDb();

  await db.query(
    `UPDATE api_versions
     SET is_active = false, deprecation_date = $2
     WHERE version = $1`,
    [version, deprecationDate]
  );
}
