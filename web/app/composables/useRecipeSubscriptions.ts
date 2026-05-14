import type { RecipeSubscription } from '@recipe-app/shared-types'
import { useToast } from './useToast'

export interface RecipeSubscriptionWithRecipe extends RecipeSubscription {
  recipe?: {
    title: string
    imageUrl: string | null
  }
}

export function useRecipeSubscriptions() {
  const subscriptions = useState<RecipeSubscriptionWithRecipe[]>('recipe-subscriptions', () => [])
  const loading = useState<boolean>('recipe-subscriptions-loading', () => false)
  const pendingSubscriptions = useState<Set<string>>('pending-subscriptions', () => new Set())
  const toast = useToast()

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
   * Subscribe to recipe updates (optimistic)
   */
  async function subscribe(recipeId: string): Promise<{ success: boolean; subscription?: RecipeSubscription; error?: { code: string; message: string } }> {
    // Check if already subscribed
    const existingIndex = subscriptions.value.findIndex(s => s.recipeId === recipeId)
    if (existingIndex >= 0 && subscriptions.value[existingIndex].subscribed) {
      return { success: true, subscription: subscriptions.value[existingIndex] }
    }

    // Store previous state for rollback
    const previousSubscriptions = [...subscriptions.value]

    // Optimistic update - immediately mark as subscribed
    pendingSubscriptions.value.add(recipeId)
    if (existingIndex >= 0) {
      subscriptions.value[existingIndex] = { ...subscriptions.value[existingIndex], subscribed: true }
    } else {
      subscriptions.value.push({
        recipeId,
        subscribed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as RecipeSubscriptionWithRecipe)
    }

    try {
      const response = await $fetch('/api/subscriptions/recipes', {
        method: 'POST',
        body: { recipeId },
      })

      pendingSubscriptions.value.delete(recipeId)

      if (response.success && response.data) {
        const newSub = {
          ...response.data,
          createdAt: response.data.createdAt ? new Date(response.data.createdAt) : undefined,
          updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined,
        } as RecipeSubscriptionWithRecipe
        const idx = subscriptions.value.findIndex(s => s.recipeId === recipeId)
        if (idx >= 0) {
          subscriptions.value[idx] = newSub
        }
        return { success: true, subscription: newSub }
      }

      subscriptions.value = previousSubscriptions
      toast.error('订阅失败，请重试')
      return { success: false, error: { code: 'ERROR', message: '订阅失败' } }
    } catch (error: unknown) {
      pendingSubscriptions.value.delete(recipeId)
      subscriptions.value = previousSubscriptions
      toast.error('订阅失败，请重试')
      return {
        success: false,
        error: (error as { data?: { error?: { code: string; message: string } } })?.data?.error || { code: 'ERROR', message: '订阅失败' }
      }
    }
  }

  /**
   * Unsubscribe from recipe updates (optimistic)
   */
  async function unsubscribe(recipeId: string): Promise<{ success: boolean; error?: { code: string; message: string } }> {
    // Store previous state for rollback
    const previousSubscriptions = [...subscriptions.value]

    // Optimistic update - immediately mark as unsubscribed
    const index = subscriptions.value.findIndex(s => s.recipeId === recipeId)
    if (index >= 0) {
      subscriptions.value[index] = { ...subscriptions.value[index], subscribed: false }
    }

    try {
      const response = await $fetch(`/api/subscriptions/recipes/${recipeId}`, {
        method: 'DELETE',
      })

      if (response.success) {
        return { success: true }
      }

      subscriptions.value = previousSubscriptions
      toast.error('取消订阅失败，请重试')
      return { success: false, error: { code: 'ERROR', message: '取消订阅失败' } }
    } catch (error: unknown) {
      subscriptions.value = previousSubscriptions
      toast.error('取消订阅失败，请重试')
      return {
        success: false,
        error: (error as { data?: { error?: { code: string; message: string } } })?.data?.error || { code: 'ERROR', message: '取消订阅失败' }
      }
    }
  }

  /**
   * Check if user is subscribed to a recipe
   */
  function isSubscribed(recipeId: string): boolean {
    const sub = subscriptions.value.find(s => s.recipeId === recipeId)
    return sub ? sub.subscribed : false
  }

  /**
   * Check if subscription operation is pending
   */
  function isPending(recipeId: string): boolean {
    return pendingSubscriptions.value.has(recipeId)
  }

  return {
    subscriptions: readonly(subscriptions),
    loading: readonly(loading),
    pendingSubscriptions: readonly(pendingSubscriptions),
    fetchSubscriptions,
    subscribe,
    unsubscribe,
    isSubscribed,
    isPending,
  }
}
