export function useHomePage() {
  const { locale } = useI18n()

  const { recipes, loading, loadingMore, error, hasMore, fetchRecipes, fetchCategoryKeys } = useRecipes()

  const searchQuery = ref('')
  const selectedCategory = ref('')
  const categories = ref<Array<{ id: number; name: string; displayName: string }>>([])
  let initComplete = false

  // Use Nuxt's useDebounceFn for consistent debouncing behavior
  const debouncedFetch = useDebounceFn(async () => {
    const filters: Record<string, string> = {}
    if (searchQuery.value) filters.search = searchQuery.value
    if (selectedCategory.value) filters.category = selectedCategory.value
    await fetchRecipes(filters)
  }, 300)

  const debouncedSearch = async () => {
    // Skip fetch if no filters are active
    if (!searchQuery.value && !selectedCategory.value) {
      await fetchRecipes({})
      return
    }
    await debouncedFetch()
  }

  const loadMore = async () => {
    if (loadingMore.value || !hasMore.value) return
    const filters: Record<string, string> = {}
    if (searchQuery.value) filters.search = searchQuery.value
    if (selectedCategory.value) filters.category = selectedCategory.value
    await fetchRecipes(filters, true)
  }

  const init = async () => {
    // Fetch categories only once on init
    categories.value = await fetchCategoryKeys()
    // Fetch recipes with current filters if any
    const filters: Record<string, string> = {}
    if (searchQuery.value) filters.search = searchQuery.value
    if (selectedCategory.value) filters.category = selectedCategory.value
    await fetchRecipes(filters)
    initComplete = true
  }

  // Only refresh recipes and categories when locale changes AFTER initial load
  // Avoids duplicate API calls since init() already fetches both
  watch(() => locale.value, async () => {
    if (!initComplete) return

    // Build filters once
    const filters: Record<string, string> = {}
    if (searchQuery.value) filters.search = searchQuery.value
    if (selectedCategory.value) filters.category = selectedCategory.value

    // Await both fetches to prevent race conditions and ensure consistent state
    categories.value = await fetchCategoryKeys()
    await fetchRecipes(filters)
  })

  const handleClearSearch = () => {
    searchQuery.value = ''
    // Clear should take effect immediately, not debounced
    fetchRecipes({})
  }

  const handleClearCategory = () => {
    selectedCategory.value = ''
    // Clear should take effect immediately, not debounced
    fetchRecipes({})
  }

  return {
    recipes,
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
