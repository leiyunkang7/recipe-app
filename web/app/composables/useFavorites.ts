import type { Recipe } from '~/types'
import type { User } from '@supabase/supabase-js'
import { mapRecipeData, type RawRecipe } from '~/utils/recipeMapper'

export const useFavorites = () => {
  const { $supabase } = useNuxtApp()
  const { locale } = useI18n()

  // Use useState for global state sharing across components
  const favoriteIds = useState<Set<string>>('favorite-ids', () => new Set())
  const loading = useState<boolean>('favorites-loading', () => false)
  const user = useState<User | null>('favorites-user', () => null)
  const initialized = useState<boolean>('favorites-initialized', () => false)

  // Track mount state for cleanup - use useState for SSR safety
  const isMounted = useState<boolean>('favorites-mounted', () => true)

  const getUser = async () => {
    // Return cached user if available to avoid repeated API calls
    if (user.value) return user.value

    const { data: { user: authUser } } = await $supabase.auth.getUser()
    user.value = authUser
    return authUser
  }

  const fetchFavoriteIds = async (userId: string) => {
    const { data, error } = await $supabase
      .from('favorites')
      .select('recipe_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching favorites:', error)
      return
    }

    favoriteIds.value = new Set((data || []).map((f: { recipe_id: string }) => f.recipe_id))
  }

  const initFavorites = async () => {
    // Skip if already initialized to avoid redundant API calls
    if (initialized.value) return

    const authUser = await getUser()
    // Check if still mounted before updating state (prevents race condition on unmount)
    if (!isMounted.value) return

    if (authUser) {
      await fetchFavoriteIds(authUser.id)
    } else {
      favoriteIds.value = new Set()
    }
    // Check again before setting initialized flag
    if (!isMounted.value) return
    initialized.value = true
  }

  const isFavorite = (recipeId: string) => {
    return favoriteIds.value.has(recipeId)
  }

  const toggleFavorite = async (recipeId: string) => {
    const authUser = await getUser()
    if (!authUser) {
      console.error('User not authenticated')
      return
    }

    // Store previous state for rollback on failure
    const previousIds = new Set(favoriteIds.value)
    const isAdding = !favoriteIds.value.has(recipeId)
    const newSet = new Set(favoriteIds.value)

    if (isAdding) {
      newSet.add(recipeId)
    } else {
      newSet.delete(recipeId)
    }
    favoriteIds.value = newSet

    try {
      if (isAdding) {
        const { error } = await $supabase
          .from('favorites')
          .insert({ user_id: authUser.id, recipe_id: recipeId })
        if (error) throw error
      } else {
        const { error } = await $supabase
          .from('favorites')
          .delete()
          .eq('user_id', authUser.id)
          .eq('recipe_id', recipeId)
        if (error) throw error
      }
    } catch (err) {
      // Rollback on failure to maintain state consistency
      favoriteIds.value = previousIds
      console.error('Error toggling favorite:', err)
    }
  }

  const addFavorite = async (recipeId: string) => {
    const authUser = await getUser()
    if (!authUser) return

    if (!favoriteIds.value.has(recipeId)) {
      const newSet = new Set(favoriteIds.value)
      newSet.add(recipeId)
      favoriteIds.value = newSet

      await $supabase
        .from('favorites')
        .insert({ user_id: authUser.id, recipe_id: recipeId })
    }
  }

  const removeFavorite = async (recipeId: string) => {
    const authUser = await getUser()
    if (!authUser) return

    if (favoriteIds.value.has(recipeId)) {
      const newSet = new Set(favoriteIds.value)
      newSet.delete(recipeId)
      favoriteIds.value = newSet

      await $supabase
        .from('favorites')
        .delete()
        .eq('user_id', authUser.id)
        .eq('recipe_id', recipeId)
    }
  }

  const fetchFavorites = async (): Promise<Recipe[]> => {
    loading.value = true

    try {
      const ids = Array.from(favoriteIds.value)
      if (ids.length === 0) {
        return []
      }

      const loc = locale.value as string

      // Use the same query pattern as useRecipes.ts (recipe_translations table doesn't exist)
      const { data, error } = await $supabase
        .from('recipes')
        .select(`
          *,
          ingredients:recipe_ingredients(
            id,
            name,
            amount,
            unit
          ),
          steps:recipe_steps(
            id,
            step_number,
            instruction,
            duration_minutes
          ),
          tags:recipe_tags(
            tag
          )
        `)
        .in('id', ids)

      if (error) throw error

      const mappedData = (data || []).map((recipe: RawRecipe) => mapRecipeData(recipe, loc)) as Recipe[]

      return mappedData
    } catch (err) {
      console.error('Error fetching favorites:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    initFavorites()
  })

  onUnmounted(() => {
    isMounted.value = false
  })

  return {
    favoriteIds, // useState already reactive
    loading, // useState already reactive
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    fetchFavorites,
  }
}
