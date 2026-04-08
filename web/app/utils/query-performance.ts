/**
 * Query Performance Analysis Utility
 * Provides tools for analyzing and monitoring Supabase query performance
 */

export interface IndexUsageStat {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
  index_size: string;
}

export interface MissingIndexRecommendation {
  schemaname: string;
  tablename: string;
  seq_scan: number;
  seq_tup_read: number;
  idx_scan: number;
  seq_scan_delta: number;
  table_size: string;
  recommendation: string;
}

export interface TableBloatInfo {
  schemaname: string;
  tablename: string;
  n_tup_ins: number;
  n_tup_upd: number;
  n_tup_del: number;
  n_live_tup: number;
  n_dead_tup: number;
  dead_tuple_pct: number;
  last_vacuum: string | null;
  last_autovacuum: string | null;
  last_analyze: string | null;
}

export interface QueryStat {
  query_preview: string;
  calls: number;
  total_exec_time: number;
  mean_exec_time: number;
  max_exec_time: number;
  min_exec_time: number;
  stddev_exec_time: number;
  rows: number;
}

export interface OptimizationRecommendation {
  recommendation: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  details: string;
}

export interface IndexPurposeEntry {
  schemaname: string;
  tablename: string;
  indexname: string;
  indexdef: string;
  purpose: string;
  index_size: string;
}

/**
 * QueryPerformanceAnalyzer - Client for querying performance views
 * 
 * These views are created by migration 009_query_performance_audit.sql
 */
export class QueryPerformanceAnalyzer {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Get index usage statistics
   * Shows which indexes are being used and how often
   */
  async getIndexUsageStats(): Promise<IndexUsageStat[]> {
    try {
      const { data, error } = await this.supabase
        .from('index_usage_stats')
        .select('*');

      if (error) {
        console.error('[QueryPerformance] Error fetching index usage stats:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[QueryPerformance] Error:', error);
      return [];
    }
  }

  /**
   * Get missing index recommendations
   * Identifies tables with high sequential scan counts that may benefit from indexes
   */
  async getMissingIndexRecommendations(): Promise<MissingIndexRecommendation[]> {
    try {
      const { data, error } = await this.supabase
        .from('missing_index_recommendations')
        .select('*');

      if (error) {
        console.error('[QueryPerformance] Error fetching missing index recommendations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[QueryPerformance] Error:', error);
      return [];
    }
  }

  /**
   * Get table bloat analysis
   * Shows tables with high dead tuple counts that may need vacuuming
   */
  async getTableBloatAnalysis(): Promise<TableBloatInfo[]> {
    try {
      const { data, error } = await this.supabase
        .from('table_bloat_analysis')
        .select('*');

      if (error) {
        console.error('[QueryPerformance] Error fetching table bloat analysis:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[QueryPerformance] Error:', error);
      return [];
    }
  }

  /**
   * Get slow query statistics
   * Note: Requires pg_stat_statements extension to be enabled
   */
  async getQueryStatistics(): Promise<QueryStat[]> {
    try {
      const { data, error } = await this.supabase
        .from('query_statistics')
        .select('*');

      if (error) {
        console.error('[QueryPerformance] Error fetching query statistics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[QueryPerformance] Error:', error);
      return [];
    }
  }

  /**
   * Get composite index candidates
   * Suggests composite indexes based on common query patterns
   */
  async getCompositeIndexCandidates(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('composite_index_candidates')
        .select('*');

      if (error) {
        console.error('[QueryPerformance] Error fetching composite index candidates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[QueryPerformance] Error:', error);
      return [];
    }
  }

  /**
   * Get index coverage analysis
   * Shows which indexes are covering indexes vs standard indexes
   */
  async getIndexCoverageAnalysis(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('index_coverage_analysis')
        .select('*');

      if (error) {
        console.error('[QueryPerformance] Error fetching index coverage analysis:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[QueryPerformance] Error:', error);
      return [];
    }
  }

  /**
   * Get index purpose catalog
   * Shows all indexes with their documented purposes
   */
  async getIndexPurposeCatalog(): Promise<IndexPurposeEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('index_purpose_catalog')
        .select('*');

      if (error) {
        console.error('[QueryPerformance] Error fetching index purpose catalog:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[QueryPerformance] Error:', error);
      return [];
    }
  }

  /**
   * Get optimization recommendations for a specific table
   */
  async getTableRecommendations(tableName: string): Promise<OptimizationRecommendation[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_table_optimization_recommendations', { p_table_name: tableName });

      if (error) {
        console.error('[QueryPerformance] Error fetching table recommendations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[QueryPerformance] Error:', error);
      return [];
    }
  }

  /**
   * Run full performance audit
   * Returns all performance-related data in one call
   */
  async runFullAudit(): Promise<{
    indexUsage: IndexUsageStat[];
    missingIndexes: MissingIndexRecommendation[];
    tableBloat: TableBloatInfo[];
    queryStats: QueryStat[];
    indexCatalog: IndexPurposeEntry[];
  }> {
    const [indexUsage, missingIndexes, tableBloat, queryStats, indexCatalog] = await Promise.all([
      this.getIndexUsageStats(),
      this.getMissingIndexRecommendations(),
      this.getTableBloatAnalysis(),
      this.getQueryStatistics(),
      this.getIndexPurposeCatalog(),
    ]);

    return {
      indexUsage,
      missingIndexes,
      tableBloat,
      queryStats,
      indexCatalog,
    };
  }
}

/**
 * QueryComplexityAnalyzer - Analyzes query complexity for optimization opportunities
 */
export class QueryComplexityAnalyzer {
  /**
   * Estimate query complexity based on table size and filter count
   */
  static estimateComplexity(filters: Record<string, any>, tableRowCount?: number): {
    complexity: 'low' | 'medium' | 'high';
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let complexity: 'low' | 'medium' | 'high' = 'low';

    const filterCount = Object.keys(filters).length;
    
    if (filterCount >= 5) {
      complexity = 'high';
      suggestions.push('Consider using composite indexes for multiple filters');
    } else if (filterCount >= 3) {
      complexity = 'medium';
    }

    if (tableRowCount && tableRowCount > 10000) {
      suggestions.push('Large table detected - ensure proper indexes exist');
    }

    if (filters.search) {
      suggestions.push('Full-text search queries benefit from trigram indexes');
    }

    if (filters.category && filters.cuisine && filters.difficulty) {
      suggestions.push('Multi-table filter detected - consider composite index on (category, cuisine, difficulty)');
    }

    if (filters.maxPrepTime || filters.maxCookTime) {
      suggestions.push('Time-based filtering benefits from expression indexes on total_time');
    }

    return { complexity, suggestions };
  }
}

/**
 * IndexHealthChecker - Utility for checking index health
 */
export class IndexHealthChecker {
  /**
   * Check if an index is being used (has scans > 0)
   */
  static isIndexUsed(stat: IndexUsageStat): boolean {
    return stat.idx_scan > 0;
  }

  /**
   * Check if an index may be unused and candidate for removal
   */
  static isIndexUnused(stat: IndexUsageStat, threshold: number = 10): boolean {
    return stat.idx_scan < threshold;
  }

  /**
   * Get index efficiency score (rows fetched per scan)
   */
  static getIndexEfficiency(stat: IndexUsageStat): number {
    if (stat.idx_scan === 0) return 0;
    return stat.idx_tup_fetch / stat.idx_scan;
  }

  /**
   * Identify potentially bloated indexes
   * Large indexes with low usage may be candidates for removal
   */
  static identifyBloatingIndexes(stats: IndexUsageStat[]): IndexUsageStat[] {
    return stats.filter(stat => {
      const size = parseInt(stat.index_size.replace(/[^0-9]/g, '')) || 0;
      const unit = stat.index_size.includes('MB') ? 'MB' : stat.index_size.includes('GB') ? 'GB' : 'KB';
      const multiplier = unit === 'GB' ? 1024 * 1024 : unit === 'MB' ? 1024 : 1;
      const sizeKB = size * multiplier;
      
      return sizeKB > 1000 && stat.idx_scan < 10;
    });
  }
}

export function createQueryPerformanceAnalyzer(supabaseClient: any): QueryPerformanceAnalyzer {
  return new QueryPerformanceAnalyzer(supabaseClient);
}
