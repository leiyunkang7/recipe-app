/**
 * useRecipeRating - Recipe rating composable with optimistic updates
 *
 * Provides reactive rating state and operations for a recipe.
 * Rating submission uses optimistic updates for immediate UI feedback.
 */

import { useAuth } from './useAuth'
import { useToast } from './useToast'

export const useRecipeRating = (recipeId: string) => {
  const averageRating = ref<number>(0)
  const ratingCount = ref<number>(0)
  const userRating = ref<number>(0)
  const loading = ref<boolean>(false)
  const submitting = ref<boolean>(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const { isAuthenticated, user } = useAuth()

  /**
   * Fetch rating stats for the recipe
   */
  const fetchRatingStats = async () => {
    try {
      const response = await $fetch(`/api/ratings/${recipeId}`)
      if (response.success && response.data) {
        averageRating.value = response.data.averageRating
        ratingCount.value = response.data.ratingCount
      }
    } catch (err) {
      console.error('[useRecipeRating] Error fetching stats:', err)
    }
  }

  /**
   * Fetch the current user's rating for this recipe
   */
  const fetchUserRating = async () => {
    if (!isAuthenticated.value || !user.value) {
      userRating.value = 0
      return
    }

    try {
      const response = await $fetch(`/api/ratings/${recipeId}/user`, {
        headers: {
          'x-user-id': user.value.id,
        },
      })
      if (response.success && response.data) {
        userRating.value = response.data.score
      }
    } catch (err) {
      console.error('[useRecipeRating] Error fetching user rating:', err)
    }
  }

  /**
   * Submit a rating for the recipe with optimistic update
   */
  const submitRating = async (score: number): Promise<boolean> => {
    if (!isAuthenticated.value) {
      error.value = 'Please login to rate recipes'
      return false
    }

    // Store previous values for rollback
    const previousUserRating = userRating.value
    const previousAverage = averageRating.value
    const previousCount = ratingCount.value

    submitting.value = true
    error.value = null

    // Optimistic update - immediately show the new rating
    const wasNewRating = previousUserRating === 0
    if (wasNewRating) {
      // Adding a new rating
      userRating.value = score
      // Recalculate average with new rating
      averageRating.value = previousCount > 0
        ? (previousAverage * previousCount + score) / (previousCount + 1)
        : score
      ratingCount.value = previousCount + 1
    } else {
      // Updating existing rating
      const ratingDiff = score - previousUserRating
      userRating.value = score
      averageRating.value = previousAverage + ratingDiff / previousCount
    }

    try {
      const response = await $fetch('/api/ratings', {
        method: 'POST',
        body: {
          recipeId,
          score,
        },
      })

      if (response.success && response.data) {
        // Update with server-confirmed values
        userRating.value = response.data.score
        averageRating.value = response.data.averageRating
        ratingCount.value = response.data.ratingCount
        return true
      } else {
        // Rollback on failure
        userRating.value = previousUserRating
        averageRating.value = previousAverage
        ratingCount.value = previousCount
        error.value = response.error?.message || 'Failed to submit rating'
        toast.error(error.value)
        return false
      }
    } catch (err: unknown) {
      // Rollback on error
      userRating.value = previousUserRating
      averageRating.value = previousAverage
      ratingCount.value = previousCount
      const message = err instanceof Error ? err.message : 'Failed to submit rating'
      error.value = message
      toast.error(message)
      return false
    } finally {
      submitting.value = false
    }
  }

  /**
   * Initialize rating data
   */
  const init = async () => {
    loading.value = true
    try {
      await Promise.all([fetchRatingStats(), fetchUserRating()])
    } finally {
      loading.value = false
    }
  }

  return {
    averageRating,
    ratingCount,
    userRating,
    loading,
    submitting,
    error,
    fetchRatingStats,
    fetchUserRating,
    submitRating,
    init,
  }
}
