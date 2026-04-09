import { sql } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { createDb } from '@recipe-app/database';

export interface IndexInfo {
  indexName: string;
  tableName: string;
  indexDef: string;
  size: string;
  usageCount: bigint;
  recommendation: 'UNUSED' | 'LOW' | 'ACTIVE' | 'UNKNOWN';
}

export interface TableStats {
  tableName: string;
  sequentialScans: bigint;
  indexScans: bigint;
  tableSize: string;
  deadTuples: bigint;
  lastVacuum: Date | null;
  lastAnalyze: Date | null;
}

export interface QueryPlanResult {
  planLine: string;
}

export interface IndexAuditSummary {
  totalIndexes: number;
  unusedIndexes: IndexInfo[];
  lowUsageIndexes: IndexInfo[];
  activeIndexes: IndexInfo[];
  tableStats: TableStats[];
  recommendations: string[];
}

class IndexAuditor {
  private db: NodePgDatabase<any> | null = null;

  private getDb(): NodePgDatabase<any> {
    if (!this.db) {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) throw new Error('DATABASE_URL environment variable is not set');
      const connectionString = databaseUrl.includes('sslmode=')
        ? databaseUrl
        : `${databaseUrl}?sslmode=no-verify`;
      this.db = createDb(connectionString);
    }
    return this.db;
  }

  /**
   * Get all indexes with their usage statistics
   */
  async getIndexUsageStats(): Promise<IndexInfo[]> {
    const db = this.getDb();
    const result = await db.execute(sql`
      SELECT
        indexrelname as index_name,
        relname as table_name,
        idx_scan as usage_count
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan ASC
    `);
    return result.rows;
  }

  /**
   * Get table statistics including sequential scans and bloat
   */
  async getTableStats(): Promise<TableStats[]> {
    const db = this.getDb();
    const result = await db.execute(sql`
      SELECT
        relname as table_name,
        seq_scan as sequential_scans,
        idx_scan as index_scans,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_analyze,
        pg_size_pretty(pg_relation_size((schemaname || '.' || relname)::regclass)) as table_size
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY seq_scan DESC
    `);
    return result.rows;
  }

  /**
   * Get detailed index information from pg_indexes
   */
  async getIndexDefinitions(): Promise<{ indexName: string; tableName: string; indexDef: string; size: string }[]> {
    const db = this.getDb();
    const result = await db.execute(sql`
      SELECT
        indexname as index_name,
        tablename as table_name,
        indexdef,
        pg_size_pretty(pg_relation_size((schemaname || '.' || indexname)::regclass)) as size
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    return result.rows;
  }

  /**
   * Get unused indexes that might be candidates for removal
   */
  async getUnusedIndexes(): Promise<IndexInfo[]> {
    const db = this.getDb();
    const result = await db.execute(sql`
      SELECT
        psui.indexrelname::text as index_name,
        psui.relname::text as table_name,
        pi.indexdef as index_def,
        pg_size_pretty(pg_relation_size(psui.indexrelid))::text as size,
        psui.idx_scan as usage_count
      FROM pg_stat_user_indexes psui
      JOIN pg_index pi ON psui.indexrelid = pi.indexrelid
      WHERE psui.schemaname = 'public'
        AND NOT pi.indisunique
        AND psui.idx_scan = 0
      ORDER BY pg_relation_size(psui.indexrelid) DESC
    `);
    return result.rows.map((row: any) => ({
      ...row,
      recommendation: 'UNUSED' as const,
    }));
  }

  /**
   * Get low usage indexes that should be monitored
   */
  async getLowUsageIndexes(threshold: number = 100): Promise<IndexInfo[]> {
    const db = this.getDb();
    const result = await db.execute(sql`
      SELECT
        psui.indexrelname::text as index_name,
        psui.relname::text as table_name,
        pi.indexdef as index_def,
        pg_size_pretty(pg_relation_size(psui.indexrelid))::text as size,
        psui.idx_scan as usage_count
      FROM pg_stat_user_indexes psui
      JOIN pg_index pi ON psui.indexrelid = pi.indexrelid
      WHERE psui.schemaname = 'public'
        AND NOT pi.indisunique
        AND psui.idx_scan > 0
        AND psui.idx_scan < ${threshold}
      ORDER BY psui.idx_scan ASC
    `);
    return result.rows.map((row: any) => ({
      ...row,
      recommendation: 'LOW' as const,
    }));
  }

  /**
   * Get indexes that are actively being used
   */
  async getActiveIndexes(): Promise<IndexInfo[]> {
    const db = this.getDb();
    const result = await db.execute(sql`
      SELECT
        psui.indexrelname::text as index_name,
        psui.relname::text as table_name,
        pi.indexdef as index_def,
        pg_size_pretty(pg_relation_size(psui.indexrelid))::text as size,
        psui.idx_scan as usage_count
      FROM pg_stat_user_indexes psui
      JOIN pg_index pi ON psui.indexrelid = pi.indexrelid
      WHERE psui.schemaname = 'public'
        AND NOT pi.indisunique
        AND psui.idx_scan >= 100
      ORDER BY psui.idx_scan DESC
    `);
    return result.rows.map((row: any) => ({
      ...row,
      recommendation: 'ACTIVE' as const,
    }));
  }

  /**
   * Analyze a query and return its execution plan
   */
  async analyzeQuery(query: string): Promise<string[]> {
    const db = this.getDb();
    const result = await db.execute(sql`EXPLAIN (FORMAT TEXT) ${sql.raw(query)}`);
    return result.rows.map((row: any) => row['QUERY PLAN']);
  }

  /**
   * Get comprehensive audit summary
   */
  async getAuditSummary(): Promise<IndexAuditSummary> {
    const [unused, lowUsage, active, tableStats] = await Promise.all([
      this.getUnusedIndexes(),
      this.getLowUsageIndexes(),
      this.getActiveIndexes(),
      this.getTableStats(),
    ]);

    const recommendations: string[] = [];

    // Generate recommendations based on findings
    if (unused.length > 0) {
      recommendations.push(
        `Found ${unused.length} unused index(es) that may be removed to save space and reduce write overhead.`
      );
    }

    if (lowUsage.length > 0) {
      recommendations.push(
        `Found ${lowUsage.length} low-usage index(es) that should be monitored.`
      );
    }

    // Check for high sequential scans
    const highSeqScanTables = tableStats.filter(
      (t) => Number(t.sequentialScans) > Number(t.indexScans) * 10 && Number(t.sequentialScans) > 100
    );
    if (highSeqScanTables.length > 0) {
      recommendations.push(
        `Tables with high sequential scans detected: ${highSeqScanTables.map((t) => t.tableName).join(', ')}. Consider adding indexes.`
      );
    }

    // Check for bloat
    const bloatedTables = tableStats.filter((t) => Number(t.deadTuples) > 100);
    if (bloatedTables.length > 0) {
      recommendations.push(
        `Tables with dead tuples detected: ${bloatedTables.map((t) => t.tableName).join(', ')}. Consider running VACUUM.`
      );
    }

    return {
      totalIndexes: unused.length + lowUsage.length + active.length,
      unusedIndexes: unused,
      lowUsageIndexes: lowUsage,
      activeIndexes: active,
      tableStats,
      recommendations,
    };
  }

  /**
   * Get missing index recommendations from pg_stat_statements
   */
  async getMissingIndexRecommendations(): Promise<{ table: string; suggestion: string }[]> {
    const db = this.getDb();
    const result = await db.execute(sql`
      SELECT
        schemaname as table_name,
        'Consider adding index on ' || tablename ||
        ' if seq_scan is high and queries filter/sort this table' as suggestion
      FROM pg_stat_user_tables
      WHERE seq_scan > idx_scan * 10
        AND seq_scan > 100
        AND schemaname = 'public'
      ORDER BY seq_scan DESC
    `);
    return result.rows;
  }

  /**
   * Generate DROP statements for unused indexes
   */
  async generateDropStatements(): Promise<string[]> {
    const unused = await this.getUnusedIndexes();
    return unused.map(
      (idx) => `DROP INDEX IF EXISTS ${idx.indexName};`
    );
  }

  /**
   * Run VACUUM ANALYZE on specific tables
   */
  async vacuumAnalyze(tables: string[]): Promise<void> {
    const db = this.getDb();
    for (const table of tables) {
      await db.execute(sql`VACUUM ANALYZE ${sql.raw(table)}`);
    }
  }
}

export const indexAuditor = new IndexAuditor();

// Export singleton for convenience
export default indexAuditor;
