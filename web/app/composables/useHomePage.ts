export function useHomePage() {
  const { t } = useI18n()
  const { locale } = useI18n()

  const { recipes, loading, loadingMore, error, hasMore, fetchRecipes, fetchCategoryKeys } = useRecipes()

  const searchQuery = ref('')
  const selectedCategory = ref('')
  const categories = ref<Array<{ id: number; name: string; displayName: string }>>([])
  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  const debouncedSearch = async () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(async () => {
      const filters: Record<string, string> = {}
      if (searchQuery.value) filters.search = searchQuery.value
      if (selectedCategory.value) filters.category = selectedCategory.value
      await fetchRecipes(filters)
    }, 300)
  }

  const loadMore = async () => {
    if (loadingMore.value || !hasMore.value) return
    const filters: Record<string, string> = {}
    if (searchQuery.value) filters.search = searchQuery.value
    if (selectedCategory.value) filters.category = selectedCategory.value
    await fetchRecipes(filters, true)
  }

  const init = async () => {
    await fetchRecipes()
    categories.value = await fetchCategoryKeys()
  }

  const handleLocaleChange = async () => {
    categories.value = await fetchCategoryKeys()
    const filters: Record<string, string> = {}
    if (searchQuery.value) filters.search = searchQuery.value
    if (selectedCategory.value) filters.category = selectedCategory.value
    await fetchRecipes(filters)
  }

  const handleClearSearch = () => {
    searchQuery.value = ''
    debouncedSearch()
  }

  const handleClearCategory = () => {
    selectedCategory.value = ''
    debouncedSearch()
  }

  watch(() => locale.value, handleLocaleChange)

  onUnmounted(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
      searchTimeout = null
    }
  })

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
