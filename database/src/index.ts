/**
 * @recipe-app/database - Database Layer
 *
 * Provides typed database access using drizzle-orm + PostgreSQL.
 * This package is the single source of truth for the database schema.
 */

// Schema - all table definitions and relations
export * from './schema';

// Client - database connection factory
export { createDb, createDbFromPool, type Database } from './client';
