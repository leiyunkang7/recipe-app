import { createDb } from '@recipe-app/database';

let _db: ReturnType<typeof createDb> | null = null;

export function useDb() {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Add ssl configuration for Supabase and other cloud providers
    const connectionString = databaseUrl.includes('sslmode=') 
      ? databaseUrl 
      : `${databaseUrl}?sslmode=no-verify`;
    
    _db = createDb(connectionString);
  }
  return _db;
}
