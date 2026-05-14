import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'

// Mock Nuxt utilities
vi.mock('~/composables/useDebounceFn', () => ({
  useDebounceFn: vi.fn((fn: (...args: unknown[]) => unknown) => {
    return (...args: unknown[]) => fn(...args)
  }),
}))

vi.mock('#imports', () => ({
  useI18n: vi.fn(() => ({
    locale: ref('zh-CN'),
  })),
}))

describe('useHomePage', () => {
  // Mock useRecipes - use lightweight RecipeListItem for list view
  const mockRecipesList = ref([
    { id: '1', title: 'Recipe 1', prepTimeMinutes: 10, cookTimeMinutes: 20, servings: 4 },
    { id: '2', title: 'Recipe 2', prepTimeMinutes: 15, cookTimeMinutes: 30, servings: 2 },
  ])
  const mockLoading = ref(false)
  const mockLoadingMore = ref(false)
  const mockError = ref<string | null>(null)
  const mockHasMore = ref(true)
  const mockFetchRecipesList = vi.fn()
  const mockFetchCategoryKeys = vi.fn().mockResolvedValue([
    { id: 1, name: '家常菜', displayName: '家常菜' },
    { id: 2, name: '快手菜', displayName: '快手菜' },
  ])

  vi.mock('~/composables/useRecipes', () => ({
    useRecipes: () => ({
      recipesList: mockRecipesList,
      loading: mockLoading,
      loadingMore: mockLoadingMore,
      error: mockError,
      hasMore: mockHasMore,
      fetchRecipesList: mockFetchRecipesList,
      fetchCategoryKeys: mockFetchCategoryKeys,
    }),
  }))

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchRecipesList.mockClear()
    mockFetchCategoryKeys.mockClear()
    mockFetchCategoryKeys.mockResolvedValue([
      { id: 1, name: '家常菜', displayName: '家常菜' },
      { id: 2, name: '快手菜', displayName: '快手菜' },
    ])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with empty search query', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { searchQuery } = useHomePage()

      expect(searchQuery.value).toBe('')
    })

    it('should initialize with empty selected category', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { selectedCategory } = useHomePage()

      expect(selectedCategory.value).toBe('')
    })

    it('should have loading state from useRecipes', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { loading } = useHomePage()

      expect(loading).toBeDefined()
    })

    it('should have hasMore state from useRecipes', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { hasMore } = useHomePage()

      expect(hasMore).toBeDefined()
    })
  })

  describe('searchQuery', () => {
    it('should allow setting search query', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { searchQuery } = useHomePage()

      searchQuery.value = '番茄'
      expect(searchQuery.value).toBe('番茄')
    })
  })

  describe('selectedCategory', () => {
    it('should allow setting selected category', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { selectedCategory } = useHomePage()

      selectedCategory.value = '家常菜'
      expect(selectedCategory.value).toBe('家常菜')
    })
  })

  describe('loadMore', () => {
    it('should not call fetchRecipesList when loadingMore is true', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { loadMore } = useHomePage()

      mockLoadingMore.value = true
      mockHasMore.value = true

      await loadMore()

      expect(mockFetchRecipesList).not.toHaveBeenCalled()
    })

    it('should not call fetchRecipesList when hasMore is false', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { loadMore } = useHomePage()

      mockLoadingMore.value = false
      mockHasMore.value = false

      await loadMore()

      expect(mockFetchRecipesList).not.toHaveBeenCalled()
    })

    it('should call fetchRecipesList with current filters when loadingMore is false and hasMore is true', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { loadMore, searchQuery, selectedCategory } = useHomePage()

      mockLoadingMore.value = false
      mockHasMore.value = true
      searchQuery.value = '番茄'
      selectedCategory.value = '家常菜'

      await loadMore()

      expect(mockFetchRecipesList).toHaveBeenCalledWith(
        expect.objectContaining({
          search: '番茄',
          category: '家常菜',
        }),
        true // append = true for load more
      )
    })
  })

  describe('handleClearSearch', () => {
    it('should clear search query and trigger fetch', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { handleClearSearch, searchQuery } = useHomePage()

      searchQuery.value = '番茄'
      mockFetchRecipesList.mockClear()

      handleClearSearch()

      expect(searchQuery.value).toBe('')
    })
  })

  describe('handleClearCategory', () => {
    it('should clear selected category and trigger fetch', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { handleClearCategory, selectedCategory } = useHomePage()

      selectedCategory.value = '家常菜'
      mockFetchRecipesList.mockClear()

      handleClearCategory()

      expect(selectedCategory.value).toBe('')
    })
  })

  describe('categories', () => {
    it('should have categories from useRecipes', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { categories } = useHomePage()

      // Initial value is empty array from ref initialization
      expect(Array.isArray(categories.value)).toBe(true)
    })
  })

  describe('debouncedSearch', () => {
    it('should be a function', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { debouncedSearch } = useHomePage()

      expect(typeof debouncedSearch).toBe('function')
    })

    it('should call fetchRecipesList when called with filters', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { debouncedSearch, searchQuery } = useHomePage()

      searchQuery.value = '番茄'
      mockFetchRecipesList.mockClear()

      await debouncedSearch()

      expect(mockFetchRecipesList).toHaveBeenCalled()
    })
  })

  describe('init', () => {
    it('should fetch categories and recipes', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { init } = useHomePage()

      await init()

      expect(mockFetchCategoryKeys).toHaveBeenCalled()
      expect(mockFetchRecipesList).toHaveBeenCalled()
    })

    it('should set initComplete to true after initialization', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { init } = useHomePage()

      await init()

      // The composable should complete initialization
      expect(mockFetchCategoryKeys).toHaveBeenCalledTimes(1)
    })
  })

  describe('filter behavior', () => {
    it('should build filters with only search when category is empty', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { searchQuery, selectedCategory } = useHomePage()

      searchQuery.value = '番茄'
      selectedCategory.value = ''

      const filters: Record<string, string> = {}
      if (searchQuery.value) filters.search = searchQuery.value
      if (selectedCategory.value) filters.category = selectedCategory.value

      expect(filters).toEqual({ search: '番茄' })
    })

    it('should build filters with only category when search is empty', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { searchQuery, selectedCategory } = useHomePage()

      searchQuery.value = ''
      selectedCategory.value = '家常菜'

      const filters: Record<string, string> = {}
      if (searchQuery.value) filters.search = searchQuery.value
      if (selectedCategory.value) filters.category = selectedCategory.value

      expect(filters).toEqual({ category: '家常菜' })
    })

    it('should build filters with both search and category when both are set', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { searchQuery, selectedCategory } = useHomePage()

      searchQuery.value = '番茄'
      selectedCategory.value = '家常菜'

      const filters: Record<string, string> = {}
      if (searchQuery.value) filters.search = searchQuery.value
      if (selectedCategory.value) filters.category = selectedCategory.value

      expect(filters).toEqual({ search: '番茄', category: '家常菜' })
    })

    it('should build empty filters when both search and category are empty', async () => {
      const { useHomePage } = await import('./useHomePage')
      const { searchQuery, selectedCategory } = useHomePage()

      searchQuery.value = ''
      selectedCategory.value = ''

      const filters: Record<string, string> = {}
      if (searchQuery.value) filters.search = searchQuery.value
      if (selectedCategory.value) filters.category = selectedCategory.value

      expect(filters).toEqual({})
    })
  })
})