/**
 * useOptimistic - Re-export from useOptimisticUpdate for backward compatibility
 *
 * This file re-exports from useOptimisticUpdate to maintain backward compatibility.
 * The primary implementation is now in useOptimisticUpdate.ts which has more features
 * including debug mode, reset functionality, and useOptimisticCounter.
 */

// Re-export everything from useOptimisticUpdate for backward compatibility
export {
  useOptimisticUpdate as useOptimistic,
  useOptimisticBoolean,
  useOptimisticArray,
  type OptimisticUpdateOptions as OptimisticOptions,
  type OptimisticUpdateReturn as OptimisticReturn,
} from './useOptimisticUpdate'

// Also export the additional types from useOptimisticUpdate for convenience
export type {
  OptimisticUpdateOptions,
  OptimisticUpdateReturn,
} from './useOptimisticUpdate'
