import type { Recipe, RecipeFilters, Locale, RecipeListItem } from '~/types'
import { mapRecipeData, mapRecipeListItem, type RawRecipe, type RawRecipeListItem } from '~/utils/recipeMapper'

const PAGE_SIZE = 20

export const useRecipeQueries = () => {
  const { $supabase } = useNuxtApp()
  const { locale } = useI18n()

  // State
  const recipes = shallowRef<Recipe[]>([])
  const recipesList = shallowRef<RecipeListItem[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const currentPage = ref(0)
  const currentLocale = computed(() => locale.value as Locale)

  // Race condition handling
  let _activeAbortController: AbortController | null = null
  let _activeRequestVersion = 0
  let _activeAbortControllerList: AbortController | null = null
  let _activeRequestVersionList = 0

  const fetchRecipes = async (filters?: RecipeFilters, append = false) => {
    // Cancel any in-flight request from a previous (possibly stale) call
    if (_activeAbortController) {
      _activeAbortController.abort()
      _activeAbortController = null
    }

    const requestVersion = ++_activeRequestVersion
    const abortController = new AbortController()
    _activeAbortController = abortController

    if (!append) {
      loading.value = true
      currentPage.value = 0
      hasMore.value = true
    } else {
      loadingMore.value = true
    }
    error.value = null

    try {
      const loc = filters?.locale || currentLocale.value
      const from = append ? (currentPage.value + 1) * PAGE_SIZE : 0
      const to = from + PAGE_SIZE - 1

      // Build the base query - includes all recipe data with related ingredients, steps, tags
      // Note: recipe_translations is supported - mapRecipeData handles fallback when not present
      let query = $supabase
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
        `, { count: 'exact' })
        .abortSignal(abortController.signal)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.cuisine) {
        query = query.eq('cuisine', filters.cuisine)
      }

      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty)
      }

      if (filters?.search) {
        // Search in the recipe title column (which stores the default/translated title)
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error: err, count } = await query

      // 🛡️ Race condition guard: ignore response from a stale/aborted request
      if (requestVersion !== _activeRequestVersion) return recipes.value
      if (err) throw err

      // Show all recipes - mapRecipeData handles recipe_translations if present, falls back to category
      const mappedData = (data || []).map((recipe: RawRecipe) => mapRecipeData(recipe, loc)) as Recipe[]

      if (append) {
        recipes.value = [...recipes.value, ...mappedData]
      } else {
        recipes.value = mappedData
      }

      // Check if there are more items to load
      if (count !== null) {
        hasMore.value = recipes.value.length < count
      } else {
        hasMore.value = mappedData.length === PAGE_SIZE
      }

      if (hasMore.value) {
        currentPage.value = append ? currentPage.value + 1 : 0
      }
    } catch (err: unknown) {
      // Ignore abort errors — they indicate a cancelled stale request
      if (err instanceof Error && err.name === 'AbortError') return recipes.value
      error.value = err instanceof Error ? err.message : 'Failed to fetch recipes'
    } finally {
      if (requestVersion === _activeRequestVersion) {
        loading.value = false
        loadingMore.value = false
      }
    }

    return recipes.value
  }

  /**
   * Lightweight fetch for virtual scroll list view
   * Only fetches fields needed for RecipeCardLazy: id, title, imageUrl, prepTimeMinutes, cookTimeMinutes, servings, views
   * Avoids expensive joins on recipe_ingredients, recipe_steps, recipe_tags tables
   */
  const fetchRecipesList = async (filters?: RecipeFilters, append = false) => {
    // Cancel any in-flight request from a previous (possibly stale) call
    if (_activeAbortControllerList) {
      _activeAbortControllerList.abort()
      _activeAbortControllerList = null
    }

    const requestVersion = ++_activeRequestVersionList
    const abortController = new AbortController()
    _activeAbortControllerList = abortController

    if (!append) {
      loading.value = true
      currentPage.value = 0
      hasMore.value = true
    } else {
      loadingMore.value = true
    }
    error.value = null

    try {
      const loc = filters?.locale || currentLocale.value
      const from = append ? (currentPage.value + 1) * PAGE_SIZE : 0
      const to = from + PAGE_SIZE - 1

      // Lightweight query - only fetch fields needed for list display
      // No joins to recipe_ingredients, recipe_steps, recipe_tags
      let query = $supabase
        .from('recipes')
        .select(`
          id,
          recipe_translations(
            locale,
            title,
            description
          ),
          prep_time_minutes,
          cook_time_minutes,
          image_url,
          views,
          created_at
        `, { count: 'exact' })
        .abortSignal(abortController.signal)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.cuisine) {
        query = query.eq('cuisine', filters.cuisine)
      }

      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty)
      }

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error: err, count } = await query

      // 🛡️ Race condition guard: ignore response from a stale/aborted request
      if (requestVersion !== _activeRequestVersionList) return recipesList.value
      if (err) throw err

      const mappedData = (data || []).map((recipe: RawRecipeListItem) => mapRecipeListItem(recipe, loc))

      if (append) {
        recipesList.value = [...recipesList.value, ...mappedData]
      } else {
        recipesList.value = mappedData
      }

      if (count !== null) {
        hasMore.value = recipesList.value.length < count
      } else {
        hasMore.value = mappedData.length === PAGE_SIZE
      }

      if (hasMore.value) {
        currentPage.value = append ? currentPage.value + 1 : 0
      }
    } catch (err: unknown) {
      // Ignore abort errors — they indicate a cancelled stale request
      if (err instanceof Error && err.name === 'AbortError') return recipesList.value
      error.value = err instanceof Error ? err.message : 'Failed to fetch recipes'
    } finally {
      if (requestVersion === _activeRequestVersionList) {
        loading.value = false
        loadingMore.value = false
      }
    }

    return recipesList.value
  }

  const fetchRecipeById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const loc = currentLocale.value

      // Use optional join - mapRecipeData handles recipe_translations if present, falls back to category
      const { data, error: err } = await $supabase
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
        .eq('id', id)
        .single()

      if (err) {
        if (err.code === 'PGRST116') {
          error.value = 'Recipe not found'
        } else {
          throw err
        }
        return null
      }

      // Prefer current locale translations, fallback to zh-CN
      return mapRecipeData(data, loc)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch recipe'
      return null
    } finally {
      loading.value = false
    }
  }

  // Helper function to fetch unique field values from recipes table
  // Optimized: Only select the specific field needed, use pagination for large datasets
  const fetchUniqueFieldKeys = async (field: 'category' | 'cuisine'): Promise<Array<{ id: number; name: string; displayName: string }>> => {
    try {
      // Use RPC to get distinct values efficiently - avoids fetching all columns
      // Fallback to client-side deduplication if RPC fails
      const { data, error } = await $supabase
        .from('recipes')
        .select(field)
        .not(field, 'is', null)
        .limit(1000) // Limit to prevent excessive memory usage

      if (error) throw error

      // Get unique field names using Set for O(n) deduplication
      const uniqueNames = [...new Set((data || []).map((r: Record<string, unknown>) => r[field] as string).filter(Boolean))]

      return uniqueNames.map((name, index) => ({
        id: index + 1,
        name,
        displayName: name,
      }))
    } catch (err: unknown) {
      return []
    }
  }

  const fetchCategoryKeys = () => fetchUniqueFieldKeys('category')
  const fetchCuisineKeys = () => fetchUniqueFieldKeys('cuisine')

  // Increment views count for a recipe
  const incrementViews = async (id: string) => {
    try {
      const { error } = await $supabase.rpc('increment_views', { recipe_id: id })
      if (error) {
        // Fallback to direct update if RPC doesn't exist
        const { data } = await $supabase
          .from('recipes')
          .select('views')
          .eq('id', id)
          .single()

        if (data) {
          await $supabase
            .from('recipes')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', id)
        }
      }
    } catch (err) {
      // Silently fail for view counting - non-critical operation
    }
  }

  return {
    recipes,
    recipesList,
    loading,
    loadingMore,
    error,
    hasMore,
    currentLocale,
    fetchRecipes,
    fetchRecipesList,
    fetchRecipeById,
    fetchCategoryKeys,
    fetchCuisineKeys,
    incrementViews,
  }
}
