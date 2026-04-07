import type { ServiceResponse, RecipeSubscription } from '@recipe-app/shared-types'
import { useToast } from './useToast'

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
 * Uses optimistic updates for immediate UI feedback with rollback on failure.
 */
export function useRecipeSubscription(): UseRecipeSubscriptionReturn {
  const isSubscribed = ref(false)
  const isLoading = ref(false)
  const isPending = ref(false)
  const subscriptionError = ref<string | null>(null)
  const toast = useToast()

  /**
   * Subscribe to recipe update notifications (optimistic)
   */
  const subscribe = async (recipeId: string): Promise<boolean> => {
    const previousSubscribed = isSubscribed.value

    isPending.value = true
    subscriptionError.value = null

    // Optimistic update - immediately show subscribed
    isSubscribed.value = true

    try {
      const response = await $fetch<ServiceResponse<RecipeSubscription>>('/api/subscriptions/recipes', {
        method: 'POST',
        body: { recipeId },
      })

      if (response.success) {
        return true
      }

      // Rollback on failure
      isSubscribed.value = previousSubscribed
      subscriptionError.value = response.error?.message || 'Subscription failed'
      toast.error(subscriptionError.value)
      return false
    } catch (error: any) {
      // Rollback on error
      isSubscribed.value = previousSubscribed
      subscriptionError.value = error?.data?.error?.message || 'Subscription failed, please try again'
      toast.error(subscriptionError.value)
      return false
    } finally {
      isPending.value = false
    }
  }

  /**
   * Unsubscribe from recipe update notifications (optimistic)
   */
  const unsubscribe = async (recipeId: string): Promise<boolean> => {
    const previousSubscribed = isSubscribed.value

    isPending.value = true
    subscriptionError.value = null

    // Optimistic update - immediately show unsubscribed
    isSubscribed.value = false

    try {
      const response = await $fetch<ServiceResponse<{ message: string }>>(`/api/subscriptions/recipes/${recipeId}`, {
        method: 'DELETE',
      })

      if (response.success) {
        return true
      }

      // Rollback on failure
      isSubscribed.value = previousSubscribed
      subscriptionError.value = response.error?.message || 'Unsubscribe failed'
      toast.error(subscriptionError.value)
      return false
    } catch (error: any) {
      // Rollback on error
      isSubscribed.value = previousSubscribed
      subscriptionError.value = error?.data?.error?.message || 'Unsubscribe failed, please try again'
      toast.error(subscriptionError.value)
      return false
    } finally {
      isPending.value = false
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
        isSubscribed.value = response.data.some(
          (sub) => sub.recipeId === recipeId && sub.subscribed
        )
      } else {
        isSubscribed.value = false
      }
    } catch {
      // Silently fail - user might not be logged in
      isSubscribed.value = false
    } finally {
      isLoading.value = false
    }
  }

  return {
    isSubscribed: readonly(isSubscribed),
    isLoading: readonly(isLoading),
    isPending: readonly(isPending),
    subscriptionError: readonly(subscriptionError),
    subscribe,
    unsubscribe,
    checkSubscription,
  }
}
