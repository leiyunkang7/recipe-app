/**
 * @recipe-app/database - Database Layer
 *
 * Provides typed database access using drizzle-orm + PostgreSQL.
 * This package is the single source of truth for the database schema.
 */
export * from './schema';
export { createDb, createDbFromPool, type Database } from './client';
