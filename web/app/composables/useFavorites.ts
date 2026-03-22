import type { Recipe } from '~/types'

const FAVORITES_STORAGE_KEY = 'recipe_favorites'

interface FavoriteItem {
  recipeId: string
  addedAt: string
}

export const useFavorites = () => {
  const { $supabase } = useNuxtApp()
  const { locale } = useI18n()

  const favoriteIds = ref<Set<string>>(new Set())
  const loading = ref(false)

  const loadFromStorage = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (stored) {
        try {
          const items: FavoriteItem[] = JSON.parse(stored)
          favoriteIds.value = new Set(items.map(item => item.recipeId))
        } catch {
          favoriteIds.value = new Set()
        }
      }
    }
  }

  const saveToStorage = () => {
    if (import.meta.client) {
      const items: FavoriteItem[] = Array.from(favoriteIds.value).map(id => ({
        recipeId: id,
        addedAt: new Date().toISOString()
      }))
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items))
    }
  }

  const isFavorite = (recipeId: string) => {
    return favoriteIds.value.has(recipeId)
  }

  const toggleFavorite = async (recipeId: string) => {
    const newSet = new Set(favoriteIds.value)
    
    if (newSet.has(recipeId)) {
      newSet.delete(recipeId)
      favoriteIds.value = newSet
      saveToStorage()
      
      await $supabase
        .from('favorites')
        .delete()
        .eq('recipe_id', recipeId)
    } else {
      newSet.add(recipeId)
      favoriteIds.value = newSet
      saveToStorage()
      
      await $supabase
        .from('favorites')
        .insert({ recipe_id: recipeId })
    }
  }

  const addFavorite = async (recipeId: string) => {
    if (!favoriteIds.value.has(recipeId)) {
      const newSet = new Set(favoriteIds.value)
      newSet.add(recipeId)
      favoriteIds.value = newSet
      saveToStorage()
      
      await $supabase
        .from('favorites')
        .insert({ recipe_id: recipeId })
    }
  }

  const removeFavorite = async (recipeId: string) => {
    if (favoriteIds.value.has(recipeId)) {
      const newSet = new Set(favoriteIds.value)
      newSet.delete(recipeId)
      favoriteIds.value = newSet
      saveToStorage()
      
      await $supabase
        .from('favorites')
        .delete()
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
    loadFromStorage()
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
