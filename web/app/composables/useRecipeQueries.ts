import type { Recipe, RecipeFilters, Locale, RecipeListItem } from '~/types'
import { mapRecipeData, mapRecipeListItem, type RawRecipe, type RawRecipeListItem } from '~/utils/recipeMapper'

const PAGE_SIZE = 20

export const useRecipeQueries = () => {
  const { locale } = useI18n()

  const recipes = shallowRef<Recipe[]>([])
  const recipesList = shallowRef<RecipeListItem[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const currentPage = ref(0)
  const currentLocale = computed(() => locale.value as Locale)

  let _activeAbortController: AbortController | null = null
  let _activeRequestVersion = 0
  let _activeAbortControllerList: AbortController | null = null
  let _activeRequestVersionList = 0

  const fetchRecipes = async (filters?: RecipeFilters, append = false) => {
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
      const page = Math.floor(from / PAGE_SIZE) + 1

      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      }
      if (filters?.category) params.category = filters.category
      if (filters?.cuisine) params.cuisine = filters.cuisine
      if (filters?.difficulty) params.difficulty = filters.difficulty
      if (filters?.search) params.search = filters.search
      if (loc) params.locale = loc

      const { data, error: fetchError } = await useFetch('/api/recipes', {
        params,
        signal: abortController.signal,
      })

      if (requestVersion !== _activeRequestVersion) return recipes.value
      if (fetchError.value) throw fetchError.value

      const mappedData = (data.value?.data || []).map((recipe: RawRecipe) => mapRecipeData(recipe, loc)) as Recipe[]

      if (append) {
        recipes.value = [...recipes.value, ...mappedData]
      } else {
        recipes.value = mappedData
      }

      const total = data.value?.count || 0
      hasMore.value = recipes.value.length < total
      if (hasMore.value) {
        currentPage.value = append ? currentPage.value + 1 : 0
      }
    } catch (err: unknown) {
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

  const fetchRecipesList = async (filters?: RecipeFilters, append = false) => {
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
      const page = Math.floor(from / PAGE_SIZE) + 1

      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      }
      if (filters?.category) params.category = filters.category
      if (filters?.cuisine) params.cuisine = filters.cuisine
      if (filters?.difficulty) params.difficulty = filters.difficulty
      if (filters?.search) params.search = filters.search
      if (loc) params.locale = loc

      const { data, error: fetchError } = await useFetch('/api/recipes', {
        params,
        signal: abortController.signal,
      })

      if (requestVersion !== _activeRequestVersionList) return recipesList.value
      if (fetchError.value) throw fetchError.value

      const mappedData = (data.value?.data || []).map((recipe: RawRecipeListItem) => mapRecipeListItem(recipe, loc))

      if (append) {
        recipesList.value = [...recipesList.value, ...mappedData]
      } else {
        recipesList.value = mappedData
      }

      const total = data.value?.count || 0
      hasMore.value = recipesList.value.length < total
      if (hasMore.value) {
        currentPage.value = append ? currentPage.value + 1 : 0
      }
    } catch (err: unknown) {
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
      const params: Record<string, string> = {}
      if (loc) params.locale = loc

      const { data, error: fetchError } = await useFetch(`/api/recipes/${id}`, { params })

      if (fetchError.value) {
        if (data.value?.error === 'Recipe not found') {
          error.value = 'Recipe not found'
        } else {
          throw fetchError.value
        }
        return null
      }

      if (data.value?.error) {
        error.value = data.value.error
        return null
      }

      return mapRecipeData(data.value?.data, loc)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch recipe'
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchUniqueFieldKeys = async (field: 'category' | 'cuisine'): Promise<Array<{ id: number; name: string; displayName: string }>> => {
    try {
      const endpoint = field === 'category' ? '/api/categories' : '/api/cuisines'
      const { data } = await useFetch(endpoint)

      return (data.value?.data || []).map((item: { id?: string; name: string; displayName?: string }, index: number) => ({
        id: item.id || index + 1,
        name: item.name,
        displayName: item.displayName || item.name,
      }))
    } catch {
      return []
    }
  }

  const fetchCategoryKeys = () => fetchUniqueFieldKeys('category')
  const fetchCuisineKeys = () => fetchUniqueFieldKeys('cuisine')

  const incrementViews = async (id: string) => {
    try {
      await $fetch(`/api/recipes/${id}`, {
        method: 'PATCH',
        body: { incrementViews: true },
      })
    } catch {
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
