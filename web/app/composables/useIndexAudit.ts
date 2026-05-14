import { ref, readonly } from 'vue';

export interface IndexInfo {
  indexName: string;
  tableName: string;
  indexDef: string;
  size: string;
  usageCount: number;
  recommendation: 'UNUSED' | 'LOW' | 'ACTIVE' | 'UNKNOWN';
}

export interface TableStats {
  tableName: string;
  sequentialScans: number;
  indexScans: number;
  tableSize: string;
  deadTuples: number;
  lastVacuum: string | null;
  lastAnalyze: string | null;
}

export interface AuditSummary {
  totalIndexes: number;
  unusedIndexes: IndexInfo[];
  lowUsageIndexes: IndexInfo[];
  activeIndexes: IndexInfo[];
  tableStats: TableStats[];
  recommendations: string[];
}

interface UseIndexAuditReturn {
  summary: Readonly<typeof summary>;
  isLoading: Readonly<typeof isLoading>;
  error: Readonly<typeof error>;
  fetchAuditSummary: () => Promise<AuditSummary | null>;
  analyzeQuery: (query: string) => Promise<string[] | null>;
  generateDropStatements: () => Promise<string[] | null>;
}

const summary = ref<AuditSummary | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

export function useIndexAudit(): UseIndexAuditReturn {
  /**
   * Fetch comprehensive audit summary from the server
   */
  async function fetchAuditSummary(): Promise<AuditSummary | null> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await fetch('/api/admin/index-audit/summary');
      if (!response.ok) {
        throw new Error(`Failed to fetch audit summary: ${response.statusText}`);
      }
      const data = await response.json();
      summary.value = data;
      return data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('[useIndexAudit] Error fetching audit summary:', e);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Analyze a specific query and return its execution plan
   */
  async function analyzeQuery(query: string): Promise<string[] | null> {
    if (!query.trim()) {
      error.value = 'Query cannot be empty';
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/admin/index-audit/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to analyze query: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.plan;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('[useIndexAudit] Error analyzing query:', e);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Generate DROP statements for unused indexes
   */
  async function generateDropStatements(): Promise<string[] | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/admin/index-audit/drop-statements');
      if (!response.ok) {
        throw new Error(`Failed to generate drop statements: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.statements;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('[useIndexAudit] Error generating drop statements:', e);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    summary: readonly(summary),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchAuditSummary,
    analyzeQuery,
    generateDropStatements,
  };
}
