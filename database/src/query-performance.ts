/**
 * Query Performance Monitoring and Analysis
 */

import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface QueryRecord {
  query: string;
  durationMs: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  params?: unknown[];
}

export interface QueryStats {
  pattern: string;
  count: number;
  totalDurationMs: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  lastExecuted: Date;
  isSlow: boolean;
}

export interface PerformanceSummary {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  totalDurationMs: number;
  avgDurationMs: number;
  slowQueries: QueryStats[];
  frequentQueries: QueryStats[];
  recentQueries: QueryRecord[];
}

export interface PerformanceMonitorConfig {
  slowQueryThresholdMs: number;
  maxRecords: number;
  logSlowQueries: boolean;
}

const DEFAULT_CONFIG: PerformanceMonitorConfig = {
  slowQueryThresholdMs: 100,
  maxRecords: 1000,
  logSlowQueries: true,
};

class PerformanceTracker {
  private records: QueryRecord[] = [];
  private config: PerformanceMonitorConfig;
  private queryPatterns: Map<string, QueryStats> = new Map();

  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  record(record: Omit<QueryRecord, 'timestamp'>): void {
    const fullRecord: QueryRecord = { ...record, timestamp: new Date() };
    this.records.push(fullRecord);
    if (this.records.length > this.config.maxRecords) {
      this.records = this.records.slice(-this.config.maxRecords);
    }
    this.updatePatternStats(fullRecord);
    if (this.config.logSlowQueries && fullRecord.durationMs > this.config.slowQueryThresholdMs) {
      console.warn(`[SLOW QUERY] ${fullRecord.durationMs}ms: ${record.query.substring(0, 200)}`);
    }
  }

  private updatePatternStats(record: QueryRecord): void {
    const pattern = this.normalizeQueryPattern(record.query);
    const existing = this.queryPatterns.get(pattern);
    if (existing) {
      existing.count++;
      existing.totalDurationMs += record.durationMs;
      existing.avgDurationMs = existing.totalDurationMs / existing.count;
      existing.minDurationMs = Math.min(existing.minDurationMs, record.durationMs);
      existing.maxDurationMs = Math.max(existing.maxDurationMs, record.durationMs);
      existing.lastExecuted = record.timestamp;
      existing.isSlow = existing.avgDurationMs > this.config.slowQueryThresholdMs;
    } else {
      this.queryPatterns.set(pattern, {
        pattern,
        count: 1,
        totalDurationMs: record.durationMs,
        avgDurationMs: record.durationMs,
        minDurationMs: record.durationMs,
        maxDurationMs: record.durationMs,
        lastExecuted: record.timestamp,
        isSlow: record.durationMs > this.config.slowQueryThresholdMs,
      });
    }
  }

  private normalizeQueryPattern(query: string): string {
    return query
      .replace(/['"][^'"]*['"]/g, "'?'")
      .replace(/\d+/g, '?')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
  }

  getSummary(): PerformanceSummary {
    const successfulQueries = this.records.filter((r) => r.success);
    const failedQueries = this.records.filter((r) => !r.success);
    const totalDurationMs = this.records.reduce((sum, r) => sum + r.durationMs, 0);
    const slowQueries = Array.from(this.queryPatterns.values())
      .filter((q) => q.isSlow)
      .sort((a, b) => b.avgDurationMs - a.avgDurationMs)
      .slice(0, 10);
    const frequentQueries = Array.from(this.queryPatterns.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    return {
      totalQueries: this.records.length,
      successfulQueries: successfulQueries.length,
      failedQueries: failedQueries.length,
      totalDurationMs,
      avgDurationMs: this.records.length > 0 ? totalDurationMs / this.records.length : 0,
      slowQueries,
      frequentQueries,
      recentQueries: this.records.slice(-50).reverse(),
    };
  }

  clear(): void {
    this.records = [];
    this.queryPatterns.clear();
  }

  getSlowQueries(thresholdMs?: number): QueryRecord[] {
    const threshold = thresholdMs ?? this.config.slowQueryThresholdMs;
    return this.records.filter((r) => r.durationMs > threshold).sort((a, b) => b.durationMs - a.durationMs);
  }

  updateConfig(config: Partial<PerformanceMonitorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const performanceTracker = new PerformanceTracker();

export async function withPerformanceTracking<T>(
  db: NodePgDatabase<any>,
  query: string | (() => Promise<T>),
  options: { params?: unknown[] } = {}
): Promise<T> {
  const { params } = options;
  const queryStr = typeof query === 'string' ? query : '[Drizzle Query]';
  const start = performance.now();
  try {
    let result: T;
    if (typeof query === 'function') {
      result = await query();
    } else {
      result = await db.execute(sql.raw(query)) as T;
    }
    const durationMs = performance.now() - start;
    performanceTracker.record({ query: queryStr, durationMs, success: true, params });
    return result;
  } catch (error) {
    const durationMs = performance.now() - start;
    performanceTracker.record({
      query: queryStr,
      durationMs,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      params,
    });
    throw error;
  }
}

export function createTrackedDb<T extends NodePgDatabase<any>>(db: T): T & { tracked: typeof performanceTracker } {
  const trackedDb = new Proxy(db, {
    get(target, prop) {
      const value = (target as any)[prop];
      if (typeof value === "function") {
        return async (...args: unknown[]) => {
          const start = performance.now();
          try {
            const result = await value.apply(target, args);
            const durationMs = performance.now() - start;
            const queryStr = args[0] ? String(args[0]).substring(0, 100) : "[Query]";
            performanceTracker.record({ query: queryStr, durationMs, success: true });
            return result;
          } catch (error) {
            const durationMs = performance.now() - start;
            const queryStr = args[0] ? String(args[0]).substring(0, 100) : "[Query]";
            performanceTracker.record({
              query: queryStr,
              durationMs,
              success: false,
              error: error instanceof Error ? error.message : String(error),
            });
            throw error;
          }
        };
      }
      return value;
    },
  }) as T & { tracked: typeof performanceTracker };
  trackedDb.tracked = performanceTracker;
  return trackedDb;
}

export function getPerformanceStats(): PerformanceSummary {
  return performanceTracker.getSummary();
}

export function exportPerformanceData(): string {
  return JSON.stringify(performanceTracker.getSummary(), null, 2);
}
