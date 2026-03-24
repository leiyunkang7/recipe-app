import type { Recipe } from '~/types'
import { mapRecipeData } from '~/utils/recipeMapper'

export const useFavorites = () => {
  const { $supabase } = useNuxtApp()
  const { locale } = useI18n()

  // Use useState for global state sharing across components
  const favoriteIds = useState<Set<string>>('favorite-ids', () => new Set())
  const loading = useState<boolean>('favorites-loading', () => false)
  const user = useState<any>('favorites-user', () => null)
  const initialized = useState<boolean>('favorites-initialized', () => false)

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

    favoriteIds.value = new Set((data || []).map((f: any) => f.recipe_id))
  }

  const initFavorites = async () => {
    // Skip if already initialized to avoid redundant API calls
    if (initialized.value) return

    const authUser = await getUser()
    // Check if still mounted before updating state (prevents race condition on unmount)
    if (!isMounted) return

    if (authUser) {
      await fetchFavoriteIds(authUser.id)
    } else {
      favoriteIds.value = new Set()
    }
    // Check again before setting initialized flag
    if (!isMounted) return
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

    const newSet = new Set(favoriteIds.value)

    if (newSet.has(recipeId)) {
      newSet.delete(recipeId)
      favoriteIds.value = newSet

      await $supabase
        .from('favorites')
        .delete()
        .eq('user_id', authUser.id)
        .eq('recipe_id', recipeId)
    } else {
      newSet.add(recipeId)
      favoriteIds.value = newSet

      await $supabase
        .from('favorites')
        .insert({ user_id: authUser.id, recipe_id: recipeId })
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

      const mappedData = (data || []).map((recipe: any) => mapRecipeData(recipe, loc)) as Recipe[]

      return mappedData
    } catch (err) {
      console.error('Error fetching favorites:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  let isMounted = true

  onMounted(() => {
    isMounted = true
    initFavorites()
  })

  onUnmounted(() => {
    isMounted = false
  })

  return {
    favoriteIds: computed(() => favoriteIds.value),
    loading: computed(() => loading.value),
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    fetchFavorites,
  }
}
