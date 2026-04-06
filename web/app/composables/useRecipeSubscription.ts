import type { ServiceResponse, RecipeSubscription } from '@recipe-app/shared-types'

export interface UseRecipeSubscriptionReturn {
  isSubscribed: Ref<boolean>
  isLoading: Ref<boolean>
  subscriptionError: Ref<string | null>
  subscribe: (recipeId: string) => Promise<boolean>
  unsubscribe: (recipeId: string) => Promise<boolean>
  checkSubscription: (recipeId: string) => Promise<void>
}

/**
 * useRecipeSubscription - Manages recipe email subscription state
 *
 * Provides functionality to subscribe/unsubscribe from recipe update notifications.
 * Uses the existing subscription API endpoints.
 */
export function useRecipeSubscription(): UseRecipeSubscriptionReturn {
  const isSubscribed = ref(false)
  const isLoading = ref(false)
  const subscriptionError = ref<string | null>(null)

  /**
   * Subscribe to recipe update notifications
   */
  const subscribe = async (recipeId: string): Promise<boolean> => {
    isLoading.value = true
    subscriptionError.value = null

    try {
      const response = await $fetch<ServiceResponse<RecipeSubscription>>('/api/subscriptions/recipes', {
        method: 'POST',
        body: { recipeId },
      })

      if (response.success) {
        isSubscribed.value = true
        return true
      } else {
        subscriptionError.value = response.error?.message || '订阅失败'
        return false
      }
    } catch (error: any) {
      subscriptionError.value = error?.data?.error?.message || '订阅失败，请稍后重试'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Unsubscribe from recipe update notifications
   */
  const unsubscribe = async (recipeId: string): Promise<boolean> => {
    isLoading.value = true
    subscriptionError.value = null

    try {
      const response = await $fetch<ServiceResponse<{ message: string }>>(`/api/subscriptions/recipes/${recipeId}`, {
        method: 'DELETE',
      })

      if (response.success) {
        isSubscribed.value = false
        return true
      } else {
        subscriptionError.value = response.error?.message || '取消订阅失败'
        return false
      }
    } catch (error: any) {
      subscriptionError.value = error?.data?.error?.message || '取消订阅失败，请稍后重试'
      return false
    } finally {
      isLoading.value = false
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
    subscriptionError: readonly(subscriptionError),
    subscribe,
    unsubscribe,
    checkSubscription,
  }
}
