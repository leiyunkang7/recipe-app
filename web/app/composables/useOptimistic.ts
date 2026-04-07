/**
 * useOptimistic - Generic optimistic update composable
 *
 * Provides a pattern for optimistic UI updates with automatic rollback
 * on failure. Uses toast notifications to inform users of rollbacks.
 */

import { useToast } from './useToast'

export interface OptimisticOptions<T> {
  /** Initial value */
  initialValue: T
  /** Toast message shown when rollback occurs (receives the error message) */
  rollbackMessage?: string | ((error: string) => string)
  /** Duration for rollback toast in ms (0 = no auto-dismiss) */
  rollbackDuration?: number
}

export interface OptimisticReturn<T> {
  /** Current value (may be optimistic or confirmed) */
  value: Ref<T>
  /** Whether an optimistic update is pending confirmation */
  isPending: Ref<boolean>
  /** Execute an optimistic update */
  mutate: (optimisticValue: T, mutation: () => Promise<void>) => Promise<void>
  /** Directly set value with optimistic mutation */
  set: (newValue: T, mutation: () => Promise<void>) => Promise<void>
  /** Rollback to the last confirmed value */
  rollback: () => void
}

/**
 * Composable for optimistic updates with automatic rollback
 *
 * @example
 * const { value, mutate } = useOptimistic({
 *   initialValue: 0,
 *   rollbackMessage: 'Failed to update. Changes reverted.'
 * })
 *
 * // Optimistically update, then confirm with server
 * await mutate(1, async () => {
 *   await $fetch('/api/update', { method: 'POST' })
 * })
 */
export function useOptimistic<T>(options: OptimisticOptions<T>): OptimisticReturn<T> {
  const { rollbackMessage, rollbackDuration = 4000 } = options

  const confirmedValue = ref(options.initialValue) as Ref<T>
  const optimisticValue = ref(options.initialValue) as Ref<T>
  const pendingValue = ref<T | null>(null) as Ref<T | null>
  const isPending = ref(false)
  const toast = useToast()

  const getRollbackMessage = (error: string): string => {
    if (!rollbackMessage) return 'Update failed. Changes reverted.'
    if (typeof rollbackMessage === 'function') return rollbackMessage(error)
    return rollbackMessage
  }

  const mutate = async (newOptimisticValue: T, mutation: () => Promise<void>): Promise<void> => {
    if (isPending.value) {
      console.warn('[useOptimistic] Mutation already pending, ignoring')
      return
    }

    // Store the previous confirmed value for rollback
    const previousValue = confirmedValue.value
    pendingValue.value = newOptimisticValue
    isPending.value = true

    // Immediately apply optimistic value
    optimisticValue.value = newOptimisticValue

    try {
      await mutation()
      // Mutation succeeded - update confirmed value
      confirmedValue.value = newOptimisticValue
    } catch (error) {
      // Mutation failed - rollback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      optimisticValue.value = previousValue
      confirmedValue.value = previousValue
      toast.error(getRollbackMessage(errorMessage), rollbackDuration)
    } finally {
      pendingValue.value = null
      isPending.value = false
    }
  }

  const set = async (newValue: T, mutation: () => Promise<void>): Promise<void> => {
    await mutate(newValue, mutation)
  }

  const rollback = () => {
    if (pendingValue.value !== null) {
      optimisticValue.value = confirmedValue.value
      pendingValue.value = null
      isPending.value = false
    }
  }

  return {
    get value() {
      // If pending, show optimistic value; otherwise show confirmed
      return isPending.value ? optimisticValue : confirmedValue
    },
    isPending,
    mutate,
    set,
    rollback,
  }
}

/**
 * useOptimisticBoolean - Optimistic updates for boolean values
 *
 * Specialized version for boolean toggles with built-in toggle function.
 */
export function useOptimisticBoolean(options: {
  initialValue: boolean
  rollbackMessage?: string
}): OptimisticReturn<boolean> & {
  toggle: (mutation: () => Promise<void>) => Promise<void>
} {
  const optimistic = useOptimistic<boolean>({
    initialValue: options.initialValue,
    rollbackMessage: options.rollbackMessage,
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
 * useOptimisticArray - Optimistic updates for array values
 *
 * Provides add/remove/toggle operations optimized for arrays.
 */
export function useOptimisticArray<T>(options: {
  initialValue: T[]
  rollbackMessage?: string
  keyFn?: (item: T) => string | number
}): OptimisticReturn<T[]> & {
  add: (item: T, mutation: () => Promise<void>) => Promise<void>
  remove: (item: T, mutation: () => Promise<void>) => Promise<void>
  toggle: (item: T, mutation: () => Promise<void>) => Promise<void>
  has: (item: T) => boolean
} {
  const { keyFn = (item: T) => item as unknown as string } = options

  const optimistic = useOptimistic<T[]>({
    initialValue: options.initialValue,
    rollbackMessage: options.rollbackMessage,
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
