/**
 * useOptimisticUpdate - Enhanced optimistic update composable for recipe-app
 *
 * Provides a robust pattern for optimistic UI updates with:
 * - Immediate UI feedback (optimistic state)
 * - Background server sync
 * - Automatic rollback on failure
 * - Toast notifications for errors
 * - Pending state indicators
 *
 * This is the primary composable for optimistic updates in the recipe app.
 * Use it for favorites, likes, ratings, and any interactive counters.
 */

import { useToast } from './useToast'

export interface OptimisticUpdateOptions<T> {
  /** Initial value */
  initialValue: T
  /** Custom error message for rollback toast */
  rollbackMessage?: string | ((error: string) => string)
  /** Toast duration in ms (0 = no auto-dismiss) */
  rollbackDuration?: number
  /** Enable debug logging */
  debug?: boolean
}

export interface OptimisticUpdateReturn<T> {
  /** Current value (reactive - updates with optimistic changes) */
  value: Ref<T>
  /** Whether a mutation is pending server confirmation */
  isPending: Ref<boolean>
  /** Execute optimistic update with server mutation */
  mutate: (optimisticValue: T, mutation: () => Promise<void>) => Promise<void>
  /** Shortcut for mutate with a new value */
  set: (newValue: T, mutation: () => Promise<void>) => Promise<void>
  /** Manually rollback to the last confirmed value */
  rollback: () => void
  /** Reset to initial value */
  reset: () => void
}

/**
 * Generic optimistic update composable
 *
 * @example
 * // Counter example
 * const { value, mutate } = useOptimisticUpdate({
 *   initialValue: 0,
 *   rollbackMessage: 'Failed to update count'
 * })
 *
 * // Increment optimistically
 * await mutate(value.value + 1, async () => {
 *   await $fetch('/api/increment', { method: 'POST' })
 * })
 *
 * @example
 * // Boolean toggle example
 * const { value, mutate } = useOptimisticUpdate({
 *   initialValue: false,
 *   rollbackMessage: (err) => `Toggle failed: ${err}`
 * })
 *
 * await mutate(!value.value, async () => {
 *   await $fetch('/api/toggle', { method: 'POST' })
 * })
 */
export function useOptimisticUpdate<T>(options: OptimisticUpdateOptions<T>): OptimisticUpdateReturn<T> {
  const { rollbackMessage, rollbackDuration = 4000, debug = false } = options

  // Internal state
  const confirmedValue = ref(options.initialValue) as Ref<T>
  const optimisticValue = ref(options.initialValue) as Ref<T>
  const pendingValue = ref<T | null>(null) as Ref<T | null>
  const isPending = ref(false)
  const toast = useToast()

  const log = (...args: unknown[]) => {
    if (debug) {
      console.debug('[useOptimisticUpdate]', ...args)
    }
  }

  const getRollbackMessage = (error: string): string => {
    if (!rollbackMessage) return `Update failed: ${error}. Changes reverted.`
    if (typeof rollbackMessage === 'function') return rollbackMessage(error)
    return rollbackMessage
  }

  /**
   * Execute an optimistic update
   *
   * 1. Immediately apply optimistic value to UI
   * 2. Execute server mutation in background
   * 3. On success: confirm the value
   * 4. On failure: rollback to previous confirmed value + show toast
   */
  const mutate = async (newOptimisticValue: T, mutation: () => Promise<void>): Promise<void> => {
    if (isPending.value) {
      log('Mutation already pending, ignoring')
      return
    }

    // Store previous confirmed value for potential rollback
    const previousValue = confirmedValue.value
    pendingValue.value = newOptimisticValue
    isPending.value = true

    // Immediately apply optimistic value to UI
    optimisticValue.value = newOptimisticValue
    log('Optimistic update applied:', newOptimisticValue)

    try {
      await mutation()
      // Mutation succeeded - update confirmed value
      confirmedValue.value = newOptimisticValue
      log('Mutation confirmed:', newOptimisticValue)
    } catch (error) {
      // Mutation failed - rollback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      log('Mutation failed, rolling back:', errorMessage)

      optimisticValue.value = previousValue
      confirmedValue.value = previousValue

      toast.error(getRollbackMessage(errorMessage), rollbackDuration)
    } finally {
      pendingValue.value = null
      isPending.value = false
    }
  }

  /**
   * Shortcut for mutate - set a new value with mutation
   */
  const set = async (newValue: T, mutation: () => Promise<void>): Promise<void> => {
    await mutate(newValue, mutation)
  }

  /**
   * Manually rollback if user cancels or for cleanup
   */
  const rollback = () => {
    if (pendingValue.value !== null) {
      optimisticValue.value = confirmedValue.value
      pendingValue.value = null
      isPending.value = false
      log('Manual rollback performed')
    }
  }

  /**
   * Reset to initial value (clears all pending state)
   */
  const reset = () => {
    optimisticValue.value = options.initialValue
    confirmedValue.value = options.initialValue
    pendingValue.value = null
    isPending.value = false
    log('Reset to initial value')
  }

  return {
    get value() {
      // Auto-unwrapped in templates; in script use .value
      return isPending.value ? optimisticValue : confirmedValue
    },
    isPending,
    mutate,
    set,
    rollback,
    reset,
  }
}

/**
 * useOptimisticBoolean - Optimistic updates for boolean values
 *
 * Specialized version for boolean toggles (favorite, like, etc.)
 *
 * @example
 * const { value, toggle } = useOptimisticBoolean({
 *   initialValue: false,
 *   rollbackMessage: 'Failed to update favorite status'
 * })
 *
 * // Toggle optimistically
 * await toggle(async () => {
 *   await $fetch('/api/favorite', { method: 'POST' })
 * })
 */
export function useOptimisticBoolean(options: {
  initialValue: boolean
  rollbackMessage?: string | ((error: string) => string)
  rollbackDuration?: number
  debug?: boolean
}): OptimisticUpdateReturn<boolean> & {
  /** Toggle the boolean value optimistically */
  toggle: (mutation: () => Promise<void>) => Promise<void>
} {
  const optimistic = useOptimisticUpdate<boolean>({
    initialValue: options.initialValue,
    rollbackMessage: options.rollbackMessage,
    rollbackDuration: options.rollbackDuration,
    debug: options.debug,
  })

  const toggle = async (mutation: () => Promise<void>) => {
    const newValue = !optimistic.value.value
    await optimistic.mutate(newValue, mutation)
  }

  return {
    ...optimistic,
    toggle,
  }
}

/**
 * useOptimisticCounter - Optimistic updates for numeric counters
 *
 * Specialized version for counters (favorites count, likes count, etc.)
 *
 * @example
 * const { value, increment, decrement } = useOptimisticCounter({
 *   initialValue: 42
 * })
 *
 * await increment(async () => {
 *   await $fetch('/api/favorite', { method: 'POST' })
 * })
 */
export function useOptimisticCounter(options: {
  initialValue: number
  min?: number
  max?: number
  rollbackMessage?: string | ((error: string) => string)
  rollbackDuration?: number
  debug?: boolean
}): OptimisticUpdateReturn<number> & {
  /** Increment counter optimistically */
  increment: (mutation: () => Promise<void>) => Promise<void>
  /** Decrement counter optimistically */
  decrement: (mutation: () => Promise<void>) => Promise<void>
  /** Add delta to counter optimistically */
  add: (delta: number, mutation: () => Promise<void>) => Promise<void>
} {
  const { min = 0, max = Infinity, rollbackMessage, rollbackDuration, debug } = options

  const optimistic = useOptimisticUpdate<number>({
    initialValue: options.initialValue,
    rollbackMessage: rollbackMessage ?? ((err) => `Update failed: ${err}`),
    rollbackDuration: rollbackDuration ?? 4000,
    debug,
  })

  const increment = async (mutation: () => Promise<void>) => {
    const newValue = Math.min(optimistic.value.value + 1, max)
    await optimistic.mutate(newValue, mutation)
  }

  const decrement = async (mutation: () => Promise<void>) => {
    const newValue = Math.max(optimistic.value.value - 1, min)
    await optimistic.mutate(newValue, mutation)
  }

  const add = async (delta: number, mutation: () => Promise<void>) => {
    const newValue = Math.max(min, Math.min(optimistic.value.value + delta, max))
    await optimistic.mutate(newValue, mutation)
  }

  return {
    ...optimistic,
    increment,
    decrement,
    add,
  }
}

/**
 * useOptimisticArray - Optimistic updates for array values
 *
 * Specialized version for arrays (tags, ingredients, etc.)
 *
 * @example
 * const { value, add, remove, toggle } = useOptimisticArray({
 *   initialValue: ['tag1', 'tag2'],
 *   keyFn: (item) => item
 * })
 *
 * await toggle('tag3', async () => {
 *   await $fetch('/api/tags', { method: 'POST' })
 * })
 */
export function useOptimisticArray<T>(options: {
  initialValue: T[]
  rollbackMessage?: string | ((error: string) => string)
  rollbackDuration?: number
  debug?: boolean
  /** Function to extract unique key from item (default: item itself) */
  keyFn?: (item: T) => string | number
}): OptimisticUpdateReturn<T[]> & {
  add: (item: T, mutation: () => Promise<void>) => Promise<void>
  remove: (item: T, mutation: () => Promise<void>) => Promise<void>
  toggle: (item: T, mutation: () => Promise<void>) => Promise<void>
  has: (item: T) => boolean
} {
  const { keyFn = (item: T) => item as unknown as string } = options

  const optimistic = useOptimisticUpdate<T[]>({
    initialValue: options.initialValue,
    rollbackMessage: options.rollbackMessage,
    rollbackDuration: options.rollbackDuration,
    debug: options.debug,
  })

  const add = async (item: T, mutation: () => Promise<void>) => {
    const current = optimistic.value.value
    if (!current.find((i) => keyFn(i) === keyFn(item))) {
      await optimistic.mutate([...current, item], mutation)
    }
  }

  const remove = async (item: T, mutation: () => Promise<void>) => {
    const current = optimistic.value.value
    const filtered = current.filter((i) => keyFn(i) !== keyFn(item))
    if (filtered.length !== current.length) {
      await optimistic.mutate(filtered, mutation)
    }
  }

  const toggle = async (item: T, mutation: () => Promise<void>) => {
    const current = optimistic.value.value
    const exists = current.find((i) => keyFn(i) === keyFn(item))
    if (exists) {
      await remove(item, mutation)
    } else {
      await add(item, mutation)
    }
  }

  const has = (item: T): boolean => {
    return optimistic.value.value.some((i) => keyFn(i) === keyFn(item))
  }

  return {
    ...optimistic,
    add,
    remove,
    toggle,
    has,
  }
}
