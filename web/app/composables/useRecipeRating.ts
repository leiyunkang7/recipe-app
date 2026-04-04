/**
 * useRecipeRating - DISABLED (authentication temporarily disabled)
 *
 * This composable provides stub implementations to prevent runtime errors.
 * All operations return zero/empty results until authentication is restored.
 */
export const useRecipeRating = (_recipeId: string) => {
  const averageRating = ref<number>(0)
  const ratingCount = ref<number>(0)
  const userRating = ref<number>(0)
  const loading = ref<boolean>(false)
  const submitting = ref<boolean>(false)
  const error = ref<string | null>(null)

  const fetchRatingStats = async () => {
    averageRating.value = 0
    ratingCount.value = 0
  }

  const fetchUserRating = async () => {
    userRating.value = 0
  }

  const submitRating = async (_score: number): Promise<boolean> => {
    error.value = 'Authentication is temporarily disabled'
    return false
  }

  const init = async () => {
    await Promise.all([fetchRatingStats(), fetchUserRating()])
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
