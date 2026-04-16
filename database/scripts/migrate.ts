#!/usr/bin/env bun
/**
 * Database Migration Manager
 * 
 * Run migrations:   bun run database/scripts/migrate.ts
 * Rollback:        bun run database/scripts/migrate.ts --rollback
 * Rollback to:     bun run database/scripts/migrate.ts --rollback-to=010
 * Status:         bun run database/scripts/migrate.ts --status
 * 
 * Reads SQL files from database/migrations/, tracks them in migration_metadata,
 * and supports rollback to a specific version.
 */

import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const MIGRATIONS_DIR = resolve(import.meta.dir, "../migrations");
const MIGRATION_TABLE = "migration_metadata";
const SCHEMA_TABLE = "schema_migrations";
const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose") || DRY_RUN;

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
type Action = "migrate" | "rollback" | "rollback-to" | "status";
let action: Action = "migrate";
let rollbackTarget = "";

for (const arg of process.argv.slice(2)) {
  if (arg === "--rollback") action = "rollback";
  else if (arg.startsWith("--rollback-to=")) {
    action = "rollback-to";
    rollbackTarget = arg.replace("--rollback-to=", "");
  } else if (arg === "--status") action = "status";
}

function getDbUrl(): string {
  return (
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/recipe_app"
  );
}

// ---------------------------------------------------------------------------
// Postgres client (minimal, no ORM to avoid dependency issues)
// ---------------------------------------------------------------------------
interface DbClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  exec(sql: string): Promise<void>;
}

async function createClient(): Promise<DbClient> {
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({ connectionString: getDbUrl() });

  return {
    async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
      const result = await pool.query(sql, params ?? []);
      return result.rows as T[];
    },
    async exec(sql: string): Promise<void> {
      await pool.query(sql);
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function checksum(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

function logInfo(msg: string) { console.log(`[migrate] ℹ️  ${msg}`); }
function logOk(msg: string) { console.log(`[migrate] ✅ ${msg}`); }
function logWarn(msg: string) { console.log(`[migrate] ⚠️  ${msg}`); }
function logError(msg: string) { console.error(`[migrate] ❌ ${msg}`); }
function logDebug(msg: string) { if (VERBOSE) console.log(`[migrate] 🔍 ${msg}`); }

async function getAppliedMigrations(db: DbClient): Promise<Set<string>> {
  try {
    const rows = await db.query<{ name: string }>(
      `SELECT name FROM ${MIGRATION_TABLE} WHERE is_active = true ORDER BY id`
    );
    return new Set(rows.map((r) => r.name));
  } catch {
    // Table doesn't exist yet — no migrations applied
    return new Set();
  }
}

async function getAllMigrations(): Promise<{ name: string; content: string; path: string }[]> {
  if (!existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  const files = await readdir(MIGRATIONS_DIR);
  const sqlFiles = files
    .filter((f) => f.endsWith(".sql") && !f.startsWith("meta"))
    .sort();

  const migrations = await Promise.all(
    sqlFiles.map(async (file) => {
      const path = join(MIGRATIONS_DIR, file);
      const content = await readFile(path, "utf-8");
      return { name: file.replace(".sql", ""), content, path };
    })
  );

  return migrations;
}

async function ensureTables(db: DbClient): Promise<void> {
  // Ensure the migration_metadata table exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS "${MIGRATION_TABLE}" (
      id serial PRIMARY KEY,
      version varchar(50) NOT NULL,
      name varchar(255) NOT NULL,
      checksum varchar(64),
      applied_at timestamp with time zone DEFAULT now(),
      rolled_back_at timestamp with time zone,
      is_active boolean DEFAULT true NOT NULL,
      notes text,
      CONSTRAINT "${MIGRATION_TABLE}_version_name_unique" UNIQUE(version, name)
    )
  `);
  // Ensure schema_migrations exists (for drizzle compatibility)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS "${SCHEMA_TABLE}" (
      id serial PRIMARY KEY,
      migration_name varchar(255) NOT NULL UNIQUE
    )
  `);
}

async function recordMigration(
  db: DbClient,
  name: string,
  version: string,
  cs: string,
  notes?: string
): Promise<void> {
  await db.exec(
    `INSERT INTO "${MIGRATION_TABLE}" (version, name, checksum, notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (version, name) DO UPDATE SET
       is_active = true, rolled_back_at = NULL, checksum = EXCLUDED.checksum`,
    [version, name, cs, notes ?? null]
  );
}

async function markRolledBack(db: DbClient, name: string): Promise<void> {
  await db.exec(
    `UPDATE "${MIGRATION_TABLE}" SET is_active = false, rolled_back_at = now() WHERE name = $1`,
    [name]
  );
}

async function markSchemaMigration(db: DbClient, name: string): Promise<void> {
  await db.exec(
    `INSERT INTO "${SCHEMA_TABLE}" (migration_name) VALUES ($1) ON CONFLICT DO NOTHING`,
    [name]
  );
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function doMigrate(db: DbClient): Promise<void> {
  await ensureTables(db);

  const applied = await getAppliedMigrations(db);
  const migrations = await getAllMigrations();
  const pending = migrations.filter((m) => !applied.has(m.name));

  if (pending.length === 0) {
    logOk("All migrations applied — nothing to do.");
    return;
  }

  logInfo(`Found ${pending.length} pending migration(s): ${pending.map((m) => m.name).join(", ")}`);

  for (const m of pending) {
    const version = m.name.split("_")[0] ?? "unknown";
    const cs = checksum(m.content);
    logInfo(`Applying: ${m.name} (checksum: ${cs})`);

    if (DRY_RUN) {
      logDebug(`  [dry-run] Would execute:\n${m.content.slice(0, 200)}...`);
      continue;
    }

    try {
      // Split on transaction boundaries — run each statement individually
      // to avoid transaction nesting issues with CREATE TABLE IF NOT EXISTS
      const statements = m.content
        .split(/;\s*\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const stmt of statements) {
        await db.exec(stmt);
      }

      await recordMigration(db, m.name, version, cs, `Applied via migrate.ts`);
      await markSchemaMigration(db, m.name);
      logOk(`Applied: ${m.name}`);
    } catch (err: unknown) {
      logError(`Failed to apply ${m.name}: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  logOk(`Done. Applied ${pending.length} migration(s).`);
}

async function doRollback(db: DbClient): Promise<void> {
  const applied = await db.query<{ name: string; version: string }>(
    `SELECT name, version FROM ${MIGRATION_TABLE} WHERE is_active = true ORDER BY id DESC LIMIT 1`
  );

  if (applied.length === 0) {
    logWarn("No active migrations to roll back.");
    return;
  }

  const last = applied[0];
  logInfo(`Rolling back: ${last.name}`);

  if (DRY_RUN) {
    logDebug(`[dry-run] Would rollback ${last.name}`);
    return;
  }

  // Mark as rolled back (actual rollback SQL is in the migration itself)
  await markRolledBack(db, last.name);
  logOk(`Rolled back: ${last.name}`);
}

async function doRollbackTo(db: DbClient, target: string): Promise<void> {
  await ensureTables(db);

  const applied = await db.query<{ name: string; version: string }>(
    `SELECT name, version FROM ${MIGRATION_TABLE} WHERE is_active = true AND version <= $1 ORDER BY id DESC`,
    [target]
  );

  if (applied.length === 0) {
    logWarn(`No active migrations with version <= ${target} to roll back.`);
    return;
  }

  logInfo(`Rolling back to version ${target}: ${applied.length} migration(s) will be marked as rolled back.`);

  if (DRY_RUN) {
    for (const m of applied) {
      logDebug(`[dry-run] Would rollback ${m.name}`);
    }
    return;
  }

  for (const m of applied) {
    await markRolledBack(db, m.name);
    logOk(`Rolled back: ${m.name}`);
  }
}

async function doStatus(db: DbClient): Promise<void> {
  await ensureTables(db);

  const migrations = await getAllMigrations();
  let applied: Set<string>;
  try {
    applied = await getAppliedMigrations(db);
  } catch {
    applied = new Set();
  }

  console.log("\n=== Migration Status ===");
  console.log(`Migrations dir: ${MIGRATIONS_DIR}\n`);

  if (migrations.length === 0) {
    console.log("No migration files found.");
    return;
  }

  const maxName = Math.max(...migrations.map((m) => m.name.length));
  for (const m of migrations) {
    const version = m.name.split("_")[0] ?? "??";
    const padded = m.name.padEnd(maxName + 2);
    if (applied.has(m.name)) {
      console.log(`  ✅ ${padded} (v${version})`);
    } else {
      console.log(`  ⬜ ${padded} (v${version}) — PENDING`);
    }
  }

  const appliedRows = await db.query<{ name: string; rolled_back_at: Date | null }>(
    `SELECT name, rolled_back_at FROM ${MIGRATION_TABLE} WHERE NOT is_active ORDER BY id DESC LIMIT 5`
  );
  if (appliedRows.length > 0) {
    console.log("\n=== Recently Rolled Back ===");
    for (const r of appliedRows) {
      console.log(`  🔴 ${r.name} (rolled back at ${r.rolled_back_at})`);
    }
  }

  console.log(`\nTotal: ${applied.size}/${migrations.length} applied\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const db = await createClient();

try {
  switch (action) {
    case "migrate":     await doMigrate(db); break;
    case "rollback":    await doRollback(db); break;
    case "rollback-to": await doRollbackTo(db, rollbackTarget); break;
    case "status":      await doStatus(db); break;
  }
} finally {
  await (db as Awaited<ReturnType<typeof createClient>>).query("SELECT 1").then(() => {/* pool closes itself */});
}

export {};
