import type { Recipe } from '~/types'

export const useFavorites = () => {
  const { $supabase } = useNuxtApp()
  const { locale } = useI18n()

  // Use useState for global state sharing across components
  const favoriteIds = useState<Set<string>>('favorite-ids', () => new Set())
  const loading = useState<boolean>('favorites-loading', () => false)
  const user = useState<any>('favorites-user', () => null)
  const initialized = useState<boolean>('favorites-initialized', () => false)

  const getUser = async () => {
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
    if (authUser) {
      await fetchFavoriteIds(authUser.id)
    } else {
      favoriteIds.value = new Set()
    }
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

      const { data, error } = await $supabase
        .from('recipes')
        .select(`
          *,
          recipe_translations(
            locale,
            title,
            description
          ),
          ingredients:recipe_ingredients(
            id,
            name,
            amount,
            unit,
            ingredient_translations(
              locale,
              name
            )
          ),
          steps:recipe_steps(
            id,
            step_number,
            instruction,
            duration_minutes,
            step_translations(
              locale,
              instruction
            )
          ),
          tags:recipe_tags(
            tag
          )
        `)
        .in('id', ids)

      if (error) throw error

      const mappedData = (data || []).map((recipe: any) => {
        const translation = recipe.recipe_translations?.find(
          (t: any) => t.locale === loc
        ) || recipe.recipe_translations?.[0]

        return {
          ...recipe,
          title: translation?.title || recipe.category,
          description: translation?.description,
          ingredients: (recipe.ingredients || []).map((ing: any) => {
            const ingTranslation = ing.ingredient_translations?.find(
              (t: any) => t.locale === loc
            )
            return {
              id: ing.id,
              name: ingTranslation?.name || ing.name,
              amount: ing.amount,
              unit: ing.unit,
            }
          }),
          steps: (recipe.steps || [])
            .sort((a: any, b: any) => a.step_number - b.step_number)
            .map((step: any) => {
              const stepTranslation = step.step_translations?.find(
                (t: any) => t.locale === loc
              )
              return {
                id: step.id,
                stepNumber: step.step_number,
                instruction: stepTranslation?.instruction || step.instruction,
                durationMinutes: step.duration_minutes,
              }
            }),
          tags: recipe.tags?.map((t: any) => t.tag) || [],
          prepTimeMinutes: recipe.prep_time_minutes,
          cookTimeMinutes: recipe.cook_time_minutes,
          nutritionInfo: recipe.nutrition_info,
          imageUrl: recipe.image_url,
          created_at: recipe.created_at,
          updated_at: recipe.updated_at,
        }
      }) as Recipe[]

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
