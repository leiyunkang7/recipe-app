import type { User } from '@supabase/supabase-js'

/**
 * useRecipeRating - Recipe rating composable
 * 
 * Features:
 * - Get average rating and count for a recipe
 * - Submit user rating (1-5 stars)
 * - Get user's rating for a recipe
 */
export const useRecipeRating = (recipeId: string) => {
  const { $supabase } = useNuxtApp()
  
  // Reactive state
  const averageRating = ref<number>(0)
  const ratingCount = ref<number>(0)
  const userRating = ref<number>(0)
  const loading = ref<boolean>(false)
  const submitting = ref<boolean>(false)
  const error = ref<string | null>(null)
  
  const user = useState<User | null>('rating-user', () => null)
  
  // Get current user
  const getUser = async () => {
    if (user.value) return user.value
    const { data: { user: authUser } } = await $supabase.auth.getUser()
    user.value = authUser
    return authUser
  }
  
  // Fetch average rating and count for recipe
  const fetchRatingStats = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await $supabase
        .from('recipe_ratings')
        .select('score')
        .eq('recipe_id', recipeId)
      
      if (fetchError) throw fetchError
      
      if (data && data.length > 0) {
        const total = data.reduce((sum: number, r: { score: number }) => sum + r.score, 0)
        averageRating.value = Math.round((total / data.length) * 10) / 10 // 1 decimal
        ratingCount.value = data.length
      } else {
        averageRating.value = 0
        ratingCount.value = 0
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch ratings'
    } finally {
      loading.value = false
    }
  }
  
  // Fetch user's rating for this recipe
  const fetchUserRating = async () => {
    const authUser = await getUser()
    if (!authUser) return
    
    try {
      const { data, error: fetchError } = await $supabase
        .from('recipe_ratings')
        .select('score')
        .eq('recipe_id', recipeId)
        .eq('user_id', authUser.id)
        .single()
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows
        throw fetchError
      }
      
      userRating.value = data?.score || 0
    } catch (err) {
      console.error('Failed to fetch user rating:', err)
    }
  }
  
  // Submit rating
  const submitRating = async (score: number): Promise<boolean> => {
    if (score < 1 || score > 5) {
      error.value = 'Rating must be between 1 and 5'
      return false
    }
    
    const authUser = await getUser()
    if (!authUser) {
      error.value = 'Please login to rate'
      return false
    }
    
    submitting.value = true
    error.value = null
    
    try {
      const { error: upsertError } = await $supabase
        .from('recipe_ratings')
        .upsert(
          { user_id: authUser.id, recipe_id: recipeId, score },
          { onConflict: 'user_id,recipe_id' }
        )
      
      if (upsertError) throw upsertError
      
      userRating.value = score
      await fetchRatingStats() // Refresh stats
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to submit rating'
      return false
    } finally {
      submitting.value = false
    }
  }
  
  // Initialize
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
