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

// Query performance tracking
export { performanceTracker, withPerformanceTracking, createTrackedDb, getPerformanceStats, exportPerformanceData } from './query-performance';

// Index auditing
export { indexAuditor, type IndexInfo, type TableStats, type IndexAuditSummary } from './index-audit';
