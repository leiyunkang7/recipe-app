import { useDebounceFn } from '@vueuse/core'
import { useAnalytics } from './useAnalytics'

export function useHomePage() {
  const { locale } = useI18n()

  // Use lightweight fetchRecipesList for list view - avoids expensive joins
  // to recipe_ingredients, recipe_steps, recipe_tags tables since homepage only
  // displays RecipeListItem fields (id, title, imageUrl, prepTimeMinutes, etc.)
  const { recipesList, loading, loadingMore, error, hasMore, fetchRecipesList, fetchCategoryKeys, fetchCuisineKeys } = useRecipes()

  const searchQuery = ref('')
  const selectedCategory = ref('')
  const categories = ref<Array<{ id: number; name: string; displayName: string }>>([])
  const cuisines = ref<Array<{ id: number; name: string; displayName: string }>>([])
  const initStatus = ref<'idle' | 'initializing' | 'ready'>('idle')

  // Advanced search filters
  const selectedIngredients = ref<string[]>([])
  const maxTime = ref<number | undefined>(undefined)
  const minTime = ref<number | undefined>(undefined)
  const selectedTaste = ref<string[]>([])
  const selectedDifficulty = ref<'easy' | 'medium' | 'hard' | undefined>(undefined)
  const selectedCuisine = ref<string>('')
  const selectedSortBy = ref<string>('')
  const selectedMinRating = ref<number | undefined>(undefined)
  const nutritionRange = ref<{
    minCalories?: number
    maxCalories?: number
    minProtein?: number
    maxProtein?: number
    minCarbs?: number
    maxCarbs?: number
    minFat?: number
    maxFat?: number
  }>({})

  const buildFilters = (): Record<string, string> => {
    const filters: Record<string, string> = {}
    if (searchQuery.value) filters.search = searchQuery.value
    if (selectedCategory.value) filters.category = selectedCategory.value
    if (selectedCuisine.value) filters.cuisine = selectedCuisine.value
    if (selectedIngredients.value.length > 0) filters.ingredients = selectedIngredients.value.join(',')
    if (maxTime.value) filters.max_time = String(maxTime.value)
    if (minTime.value) filters.min_time = String(minTime.value)
    if (selectedTaste.value.length > 0) filters.taste = selectedTaste.value.join(',')
    if (selectedDifficulty.value) filters.difficulty = selectedDifficulty.value
    if (selectedSortBy.value) filters.sort = selectedSortBy.value
    if (selectedMinRating.value) filters.min_rating = String(selectedMinRating.value)
    const n = nutritionRange.value
    if (n.minCalories !== undefined) filters.min_calories = String(n.minCalories)
    if (n.maxCalories !== undefined) filters.max_calories = String(n.maxCalories)
    if (n.minProtein !== undefined) filters.min_protein = String(n.minProtein)
    if (n.maxProtein !== undefined) filters.max_protein = String(n.maxProtein)
    if (n.minCarbs !== undefined) filters.min_carbs = String(n.minCarbs)
    if (n.maxCarbs !== undefined) filters.max_carbs = String(n.maxCarbs)
    if (n.minFat !== undefined) filters.min_fat = String(n.minFat)
    if (n.maxFat !== undefined) filters.max_fat = String(n.maxFat)
    return filters
  }

  // Use VueUse's useDebounceFn for consistent debouncing behavior
  const debouncedFetch = useDebounceFn(async () => {
    await fetchRecipesList(buildFilters())
  }, 300, { maxWait: 500 })

  const debouncedSearch = async () => {
    // Skip fetch if no filters are active
    if (!searchQuery.value && !selectedCategory.value) {
      await fetchRecipesList({})
      return
    }
    await debouncedFetch()
    const { trackSearch } = useAnalytics()
    trackSearch(searchQuery.value, recipesList.value?.length || 0)
  }

  const loadMore = async () => {
    if (loadingMore.value || !hasMore.value) return
    await fetchRecipesList(buildFilters(), true)
  }

  const init = async () => {
    // Skip if already initializing or ready to avoid duplicate calls
    if (initStatus.value !== 'idle') return
    initStatus.value = 'initializing'

    try {
      // Use Promise.all to fetch both in parallel and wait for completion
      // before setting initStatus to 'ready' - this prevents race conditions
      // where locale change during init() could trigger duplicate API calls
      const [fetchedCategories, fetchedCuisines] = await Promise.all([
        fetchCategoryKeys(),
        fetchCuisineKeys(),
        fetchRecipesList(buildFilters()),
      ])
      categories.value = fetchedCategories
      cuisines.value = fetchedCuisines
      initStatus.value = 'ready'
    } catch {
      // Reset status on error so next init() call can retry
      initStatus.value = 'idle'
    }
  }

  // Only refresh recipes and categories when locale changes AFTER initial load is complete
  // Avoids duplicate API calls since init() already fetches both
  // Note: init() uses currentLocale.value which is reactive, so locale changes
  // during init() are automatically handled by the reactive fetch
  watch(() => locale.value, async () => {
    // Only respond to locale changes when fully initialized
    // This prevents race conditions during the init() phase
    if (initStatus.value !== 'ready') return

    // Await both fetches to prevent race conditions and ensure consistent state
    categories.value = await fetchCategoryKeys()
    cuisines.value = await fetchCuisineKeys()
    await fetchRecipesList(buildFilters())
  })

  const handleClearSearch = () => {
    searchQuery.value = ''
    // Clear should take effect immediately, not debounced
    fetchRecipesList({})
  }

  const handleClearCategory = () => {
    selectedCategory.value = ''
    // Clear should take effect immediately, not debounced
    fetchRecipesList({})
  }

  const handleClearAdvancedFilters = () => {
    selectedIngredients.value = []
    maxTime.value = undefined
    minTime.value = undefined
    selectedTaste.value = []
    selectedDifficulty.value = undefined
    selectedCuisine.value = ''
    selectedSortBy.value = ''
    selectedMinRating.value = undefined
    nutritionRange.value = {}
    fetchRecipesList(buildFilters())
  }

  return {
    recipes: recipesList,
    loading,
    loadingMore,
    error,
    hasMore,
    searchQuery,
    selectedCategory,
    categories,
    cuisines,
    debouncedSearch,
    loadMore,
    init,
    handleClearSearch,
    handleClearCategory,
    // Advanced filters
    selectedIngredients,
    maxTime,
    minTime,
    selectedTaste,
    selectedDifficulty,
    selectedCuisine,
    selectedSortBy,
    selectedMinRating,
    nutritionRange,
    handleClearAdvancedFilters,
  }
}
