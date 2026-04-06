import type { RecipeSubscription } from '@recipe-app/shared-types'

export interface RecipeSubscriptionWithRecipe extends RecipeSubscription {
  recipe?: {
    title: string
    imageUrl: string | null
  }
}

export function useRecipeSubscriptions() {
  const subscriptions = useState<RecipeSubscriptionWithRecipe[]>('recipe-subscriptions', () => [])
  const loading = useState<boolean>('recipe-subscriptions-loading', () => false)

  /**
   * Fetch user's recipe subscriptions
   */
  async function fetchSubscriptions(): Promise<RecipeSubscriptionWithRecipe[]> {
    loading.value = true
    try {
      const response = await $fetch('/api/subscriptions/recipes')
      if (response.success && response.data) {
        subscriptions.value = response.data.map((sub: unknown) => ({
          ...sub,
          createdAt: sub.createdAt ? new Date(sub.createdAt) : undefined,
          updatedAt: sub.updatedAt ? new Date(sub.updatedAt) : undefined,
        }))
        return subscriptions.value
      }
      return []
    } catch (error) {
      console.error('[useRecipeSubscriptions] fetchSubscriptions error:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Subscribe to recipe updates
   */
  async function subscribe(recipeId: string): Promise<{ success: boolean; subscription?: RecipeSubscription; error?: { code: string; message: string } }> {
    loading.value = true
    try {
      const response = await $fetch('/api/subscriptions/recipes', {
        method: 'POST',
        body: { recipeId },
      })

      if (response.success && response.data) {
        const newSub = {
          ...response.data,
          createdAt: response.data.createdAt ? new Date(response.data.createdAt) : undefined,
          updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined,
        } as RecipeSubscriptionWithRecipe
        // Add to local state if not already present
        const existingIndex = subscriptions.value.findIndex(s => s.recipeId === recipeId)
        if (existingIndex >= 0) {
          subscriptions.value[existingIndex] = newSub
        } else {
          subscriptions.value.push(newSub)
        }
        return { success: true, subscription: newSub }
      } else {
        return { success: false, error: (response as { error?: unknown }).error as { code: string; message: string } | undefined }
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: (error as { data?: { error?: { code: string; message: string } } })?.data?.error || { code: 'ERROR', message: '订阅失败' }
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Unsubscribe from recipe updates
   */
  async function unsubscribe(recipeId: string): Promise<{ success: boolean; error?: { code: string; message: string } }> {
    loading.value = true
    try {
      const response = await $fetch(`/api/subscriptions/recipes/${recipeId}`, {
        method: 'DELETE',
      })

      if (response.success) {
        // Update local state
        const index = subscriptions.value.findIndex(s => s.recipeId === recipeId)
        if (index >= 0) {
          subscriptions.value[index].subscribed = false
        }
        return { success: true }
      } else {
        return { success: false, error: (response as { error?: unknown }).error as { code: string; message: string } | undefined }
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: (error as { data?: { error?: { code: string; message: string } } })?.data?.error || { code: 'ERROR', message: '取消订阅失败' }
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if user is subscribed to a recipe
   */
  function isSubscribed(recipeId: string): boolean {
    return subscriptions.value.some(s => s.recipeId === recipeId && s.subscribed)
  }

  return {
    subscriptions: readonly(subscriptions),
    loading: readonly(loading),
    fetchSubscriptions,
    subscribe,
    unsubscribe,
    isSubscribed,
  }
}
