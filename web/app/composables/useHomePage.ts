export function useHomePage() {
  const { locale } = useI18n()

  // Use lightweight fetchRecipesList for list view - avoids expensive joins
  // to recipe_ingredients, recipe_steps, recipe_tags tables since homepage only
  // displays RecipeListItem fields (id, title, imageUrl, prepTimeMinutes, etc.)
  const { recipesList, loading, loadingMore, error, hasMore, fetchRecipesList, fetchCategoryKeys } = useRecipes()

  const searchQuery = ref('')
  const selectedCategory = ref('')
  const categories = ref<Array<{ id: number; name: string; displayName: string }>>([])
  const initStatus = ref<'idle' | 'initializing' | 'ready'>('idle')

  const buildFilters = (): Record<string, string> => {
    const filters: Record<string, string> = {}
    if (searchQuery.value) filters.search = searchQuery.value
    if (selectedCategory.value) filters.category = selectedCategory.value
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
      const [fetchedCategories] = await Promise.all([
        fetchCategoryKeys(),
        fetchRecipesList(buildFilters()),
      ])
      categories.value = fetchedCategories
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
