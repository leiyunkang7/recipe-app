import type { ServiceResponse, RecipeSubscription } from '@recipe-app/shared-types'
import { useToast } from './useToast'
import { useOptimisticBoolean } from './useOptimisticUpdate'

export interface UseRecipeSubscriptionReturn {
  isSubscribed: Ref<boolean>
  isLoading: Ref<boolean>
  isPending: Ref<boolean>
  subscriptionError: Ref<string | null>
  subscribe: (recipeId: string) => Promise<boolean>
  unsubscribe: (recipeId: string) => Promise<boolean>
  checkSubscription: (recipeId: string) => Promise<void>
}

/**
 * useRecipeSubscription - Manages recipe email subscription state with optimistic updates
 *
 * Provides functionality to subscribe/unsubscribe from recipe update notifications.
 * Uses useOptimisticBoolean for immediate UI feedback with automatic rollback on failure.
 */
export function useRecipeSubscription(): UseRecipeSubscriptionReturn {
  const isLoading = ref(false)
  const subscriptionError = ref<string | null>(null)
  const toast = useToast()

  // Shared optimistic state - initialize as false, will be set by checkSubscription
  const optimisticSubscribed = useOptimisticBoolean({
    initialValue: false,
    rollbackMessage: 'Subscription failed. Please try again.',
  })

  /**
   * Subscribe to recipe update notifications (optimistic)
   */
  const subscribe = async (recipeId: string): Promise<boolean> => {
    subscriptionError.value = null

    const mutation = async () => {
      const response = await $fetch<ServiceResponse<RecipeSubscription>>('/api/subscriptions/recipes', {
        method: 'POST',
        body: { recipeId },
      })

      if (!response.success) {
        throw new Error(response.error?.message || 'Subscription failed')
      }
    }

    try {
      await optimisticSubscribed.toggle(mutation)
      return true
    } catch (err) {
      console.error('[useRecipeSubscription] Error subscribing:', err)
      const message = err instanceof Error ? err.message : 'Subscription failed, please try again'
      subscriptionError.value = message
      toast.error(message)
      return false
    }
  }

  /**
   * Unsubscribe from recipe update notifications (optimistic)
   */
  const unsubscribe = async (recipeId: string): Promise<boolean> => {
    subscriptionError.value = null

    const mutation = async () => {
      const response = await $fetch<ServiceResponse<{ message: string }>>(`/api/subscriptions/recipes/${recipeId}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        throw new Error(response.error?.message || 'Unsubscribe failed')
      }
    }

    try {
      await optimisticSubscribed.toggle(mutation)
      return true
    } catch (err) {
      console.error('[useRecipeSubscription] Error unsubscribing:', err)
      const message = err instanceof Error ? err.message : 'Unsubscribe failed, please try again'
      subscriptionError.value = message
      toast.error(message)
      return false
    }
  }

  /**
   * Check if user is subscribed to a recipe
   */
  const checkSubscription = async (recipeId: string): Promise<void> => {
    isLoading.value = true
    subscriptionError.value = null

    try {
      const response = await $fetch<ServiceResponse<RecipeSubscription[]>>('/api/subscriptions/recipes', {
        method: 'GET',
      })

      if (response.success && response.data) {
        const isSubscribed = response.data.some(
          (sub) => sub.recipeId === recipeId && sub.subscribed
        )
        // Update optimistic state with confirmed value from server
        optimisticSubscribed.reset()
        if (isSubscribed) {
          optimisticSubscribed.value.value = true
        }
      }
    } catch {
      // Silently fail - user might not be logged in
    } finally {
      isLoading.value = false
    }
  }

  return {
    isSubscribed: optimisticSubscribed.value,
    isLoading: readonly(isLoading),
    isPending: optimisticSubscribed.isPending,
    subscriptionError: readonly(subscriptionError),
    subscribe,
    unsubscribe,
    checkSubscription,
  }
}
