export function useHomePage() {
  const { locale } = useI18n()

  // Use lightweight fetchRecipesList for list view - avoids expensive joins
  // to recipe_ingredients, recipe_steps, recipe_tags tables since homepage only
  // displays RecipeListItem fields (id, title, imageUrl, prepTimeMinutes, etc.)
  const { recipesList, loading, loadingMore, error, hasMore, fetchRecipesList, fetchCategoryKeys } = useRecipes()

  const searchQuery = ref('')
  const selectedCategory = ref('')
  const categories = ref<Array<{ id: number; name: string; displayName: string }>>([])
  let initComplete = false

  const buildFilters = (): Record<string, string> => {
    const filters: Record<string, string> = {}
    if (searchQuery.value) filters.search = searchQuery.value
    if (selectedCategory.value) filters.category = selectedCategory.value
    return filters
  }

  // Use Nuxt's useDebounceFn for consistent debouncing behavior
  const debouncedFetch = useDebounceFn(async () => {
    await fetchRecipesList(buildFilters())
  }, 300)

  const debouncedSearch = async () => {
    // Skip fetch if no filters are active
    if (!searchQuery.value && !selectedCategory.value) {
      await fetchRecipesList({})
      return
    }
    await debouncedFetch()
  }

  const loadMore = async () => {
    if (loadingMore.value || !hasMore.value) return
    await fetchRecipesList(buildFilters(), true)
  }

  const init = async () => {
    // Fetch categories only once on init
    categories.value = await fetchCategoryKeys()
    // Fetch recipes with current filters if any
    await fetchRecipesList(buildFilters())
    initComplete = true
  }

  // Only refresh recipes and categories when locale changes AFTER initial load
  // Avoids duplicate API calls since init() already fetches both
  // Note: init() uses currentLocale.value which is reactive, so locale changes
  // during init() are automatically handled by the reactive fetch
  watch(() => locale.value, async () => {
    if (!initComplete) return

    // Await both fetches to prevent race conditions and ensure consistent state
    categories.value = await fetchCategoryKeys()
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

  return {
    recipes: recipesList,
    loading,
    loadingMore,
    error,
    hasMore,
    searchQuery,
    selectedCategory,
    categories,
    debouncedSearch,
    loadMore,
    init,
    handleClearSearch,
    handleClearCategory,
  }
}
