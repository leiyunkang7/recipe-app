import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Create a drizzle database instance from a connection string.
 *
 * @param connectionString - PostgreSQL connection URL
 *   e.g. "postgresql://user:password@localhost:5432/recipe_app"
 * @returns drizzle-orm database instance with full schema types
 */
export function createDb(connectionString: string): NodePgDatabase<typeof schema> {
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

/**
 * Create a drizzle database instance from a Pool.
 * Useful for reusing an existing pool in long-running processes.
 */
export function createDbFromPool(pool: Pool): NodePgDatabase<typeof schema> {
  return drizzle(pool, { schema });
}

export type Database = NodePgDatabase<typeof schema>;
