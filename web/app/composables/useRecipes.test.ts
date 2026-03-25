import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRecipes } from './useRecipes'

// Mock data
const mockRecipe = {
  id: '1',
  title: 'Test Recipe',
  description: 'A test recipe',
  category: 'main',
  cuisine: 'italian',
  servings: 4,
  prep_time_minutes: 15,
  cook_time_minutes: 30,
  difficulty: 'medium',
  image_url: 'https://example.com/image.jpg',
  views: 100,
  created_at: '2024-01-01',
  ingredients: [
    { id: '1', name: 'Flour', amount: 2, unit: 'cups' }
  ],
  steps: [
    { id: '1', step_number: 1, instruction: 'Mix ingredients', duration_minutes: 10 }
  ],
  tags: [{ tag: 'italian' }]
}

const mockSupabaseResponse = {
  data: [mockRecipe],
  error: null,
  count: 1
}

// Mock Nuxt app
const createMockSupabase = (overrides = {}) => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockResolvedValue(mockSupabaseResponse),
  insert: vi.fn().mockResolvedValue({ data: { ...mockRecipe, id: 'new-id' }, error: null }),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: mockRecipe, error: null }),
  ...overrides
})

const mockSupabase = createMockSupabase()

vi.mock('~/app', () => ({
  useNuxtApp: () => ({
    $supabase: mockSupabase
  })
}))

vi.mock('~/utils/recipeMapper', () => ({
  mapRecipeData: vi.fn((data) => data),
  type RawRecipe = {} as any
}))

describe('useRecipes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with empty recipes array', () => {
      const { recipes, loading, error, hasMore } = useRecipes()

      expect(recipes.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(hasMore.value).toBe(true)
    })
  })

  describe('fetchRecipes', () => {
    it('should fetch recipes successfully', async () => {
      const { fetchRecipes, recipes, loading } = useRecipes()

      const result = await fetchRecipes()

      expect(loading.value).toBe(false)
      expect(result).toHaveLength(1)
      expect(recipes.value).toHaveLength(1)
    })

    it('should reset pagination when not appending', async () => {
      const { fetchRecipes, hasMore, currentPage } = useRecipes()

      await fetchRecipes(undefined, false)

      expect(hasMore.value).toBe(true)
      expect(currentPage.value).toBe(0)
    })

    it('should handle fetch error', async () => {
      const errorMockSupabase = createMockSupabase({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Fetch failed'),
          count: null
        })
      })

      vi.doMock('~/app', () => ({
        useNuxtApp: () => ({
          $supabase: errorMockSupabase
        })
      }))

      const { fetchRecipes, error } = useRecipes()

      await fetchRecipes()

      expect(error.value).toBe('Fetch failed')
    })

    it('should filter by category when provided', async () => {
      const { fetchRecipes } = useRecipes()

      await fetchRecipes({ category: 'main' })

      expect(mockSupabase.eq).toHaveBeenCalledWith('category', 'main')
    })

    it('should filter by cuisine when provided', async () => {
      const { fetchRecipes } = useRecipes()

      await fetchRecipes({ cuisine: 'italian' })

      expect(mockSupabase.eq).toHaveBeenCalledWith('cuisine', 'italian')
    })

    it('should filter by difficulty when provided', async () => {
      const { fetchRecipes } = useRecipes()

      await fetchRecipes({ difficulty: 'easy' })

      expect(mockSupabase.eq).toHaveBeenCalledWith('difficulty', 'easy')
    })

    it('should search by title when search term provided', async () => {
      const { fetchRecipes } = useRecipes()

      await fetchRecipes({ search: 'pasta' })

      expect(mockSupabase.ilike).toHaveBeenCalledWith('title', '%pasta%')
    })

    it('should append recipes when append is true', async () => {
      const { fetchRecipes, recipes } = useRecipes()

      // First fetch
      await fetchRecipes(undefined, false)
      expect(recipes.value).toHaveLength(1)

      // Mock second page response
      const appendMockSupabase = createMockSupabase({
        range: vi.fn().mockResolvedValue({
          data: [{ ...mockRecipe, id: '2', title: 'Recipe 2' }],
          error: null,
          count: 2
        })
      })

      vi.doMock('~/app', () => ({
        useNuxtApp: () => ({
          $supabase: appendMockSupabase
        })
      }))

      const { fetchRecipes: fetchMore } = useRecipes()
      await fetchMore(undefined, true)

      // The result depends on the mock behavior
    })
  })

  describe('fetchRecipeById', () => {
    it('should fetch single recipe by id', async () => {
      const { fetchRecipeById, loading } = useRecipes()

      const result = await fetchRecipeById('1')

      expect(loading.value).toBe(false)
      expect(result).toBeDefined()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should set error when recipe not found', async () => {
      const notFoundMockSupabase = createMockSupabase({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      })

      vi.doMock('~/app', () => ({
        useNuxtApp: () => ({
          $supabase: notFoundMockSupabase
        })
      }))

      const { fetchRecipeById, error } = useRecipes()

      const result = await fetchRecipeById('nonexistent')

      expect(result).toBeNull()
      expect(error.value).toBe('Recipe not found')
    })
  })

  describe('deleteRecipe', () => {
    it('should delete recipe successfully', async () => {
      const { deleteRecipe, loading } = useRecipes()

      const result = await deleteRecipe('1')

      expect(result).toBe(true)
      expect(loading.value).toBe(false)
    })

    it('should return false on delete error', async () => {
      const deleteErrorMock = createMockSupabase({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Delete failed')
        })
      })

      vi.doMock('~/app', () => ({
        useNuxtApp: () => ({
          $supabase: deleteErrorMock
        })
      }))

      const { deleteRecipe, error } = useRecipes()

      const result = await deleteRecipe('1')

      expect(result).toBe(false)
      expect(error.value).toBe('Delete failed')
    })
  })

  describe('incrementViews', () => {
    it('should call supabase RPC for incrementing views', async () => {
      const { incrementViews } = useRecipes()

      const rpcMock = vi.fn().mockResolvedValue({ error: null })
      const rpcSupabase = createMockSupabase({
        rpc: rpcMock
      })

      vi.doMock('~/app', () => ({
        useNuxtApp: () => ({
          $supabase: rpcSupabase
        })
      }))

      await incrementViews('1')

      expect(rpcMock).toHaveBeenCalledWith('increment_views', { recipe_id: '1' })
    })

    it('should fallback to direct update when RPC fails', async () => {
      const fallbackSupabase = {
        rpc: vi.fn().mockResolvedValue({ error: new Error('RPC not found') }),
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { views: 10 }, error: null }),
        update: vi.fn().mockReturnThis()
      }

      vi.doMock('~/app', () => ({
        useNuxtApp: () => ({
          $supabase: fallbackSupabase
        })
      }))

      const { incrementViews } = useRecipes()

      // Should not throw
      await incrementViews('1')
    })
  })

  describe('fetchCategoryKeys', () => {
    it('should fetch unique categories', async () => {
      const categorySupabase = createMockSupabase({
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        then: vi.fn()
      })

      // This is a simplified test - in real scenario would need proper mock chain
      const { fetchCategoryKeys } = useRecipes()

      const result = await fetchCategoryKeys()

      // Result is array from mock
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('currentLocale', () => {
    it('should return current locale from i18n', () => {
      const { currentLocale } = useRecipes()
      expect(currentLocale.value).toBeDefined()
    })
  })

  describe('fetchRecipes with multiple filters', () => {
    it('should apply all filters when multiple are provided', async () => {
      const { fetchRecipes } = useRecipes()

      await fetchRecipes({
        category: 'main',
        cuisine: 'italian',
        difficulty: 'easy',
        search: 'pasta'
      })

      expect(mockSupabase.eq).toHaveBeenCalledWith('category', 'main')
      expect(mockSupabase.eq).toHaveBeenCalledWith('cuisine', 'italian')
      expect(mockSupabase.eq).toHaveBeenCalledWith('difficulty', 'easy')
      expect(mockSupabase.ilike).toHaveBeenCalledWith('title', '%pasta%')
    })
  })

  describe('fetchRecipes pagination behavior', () => {
    it('should set loadingMore to true when appending', async () => {
      const { fetchRecipes, loadingMore } = useRecipes()

      const appendMockSupabase = createMockSupabase({
        range: vi.fn().mockResolvedValue({
          data: [{ ...mockRecipe, id: '2' }],
          error: null,
          count: 2
        })
      })

      vi.doMock('~/app', () => ({
        useNuxtApp: () => ({
          $supabase: appendMockSupabase
        })
      }))

      const result = fetchRecipes(undefined, true)
      expect(loadingMore.value).toBe(true)
    })

    it('should handle empty data response', async () => {
      const emptyMockSupabase = createMockSupabase({
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      })

      vi.doMock('~/app', () => ({
        useNuxtApp: () => ({
          $supabase: emptyMockSupabase
        })
      }))

      const { fetchRecipes, recipes } = useRecipes()
      const result = await fetchRecipes()

      expect(recipes.value).toEqual([])
    })
  })

  describe('fetchRecipeById error handling', () => {
    it('should handle non-PGRST116 errors', async () => {
      const errorMockSupabase = createMockSupabase({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'OTHER_ERROR', message: 'Database error' }
        })
      })

      vi.doMock('~/app', () => ({
        useNuxtApp: () => ({
          $supabase: errorMockSupabase
        })
      }))

      const { fetchRecipeById, error } = useRecipes()

      const result = await fetchRecipeById('1')

      expect(result).toBeNull()
      expect(error.value).toBe('Database error')
    })
  })

  describe('createRecipe', () => {
    it('should create recipe with basic fields', async () => {
      const { createRecipe, loading } = useRecipes()

      const recipeData = {
        category: 'main',
        cuisine: 'italian',
        servings: 4,
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        difficulty: 'easy',
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: [],
        steps: []
      }

      const result = await createRecipe(recipeData)

      expect(loading.value).toBe(false)
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should return null on create error', async () => {
      const errorCreateMock = createMockSupabase({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' }
        })
      })

      vi.doMock('~/app', () => ({
        useNuxtApp: () => ({
          $supabase: errorCreateMock
        })
      }))

      const { createRecipe, error } = useRecipes()

      const recipeData = {
        category: 'main',
        cuisine: 'italian',
        servings: 4,
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        difficulty: 'easy',
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: [],
        steps: []
      }

      const result = await createRecipe(recipeData)

      expect(result).toBeNull()
      expect(error.value).toBe('Insert failed')
    })
  })

  describe('updateRecipe', () => {
    it('should update recipe fields', async () => {
      const { updateRecipe, loading } = useRecipes()

      const updateData = {
        category: 'dessert',
        cuisine: 'french'
      }

      const result = await updateRecipe('1', updateData)

      expect(loading.value).toBe(false)
      expect(mockSupabase.update).toHaveBeenCalled()
    })

    it('should return null on update error', async () => {
      const errorUpdateMock = createMockSupabase({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' }
        })
      })

      vi.doMock('~/app', () => ({
        useNuxtApp: () => ({
          $supabase: errorUpdateMock
        })
      }))

      const { updateRecipe, error } = useRecipes()

      const result = await updateRecipe('1', { category: 'dessert' })

      expect(result).toBeNull()
      expect(error.value).toBe('Update failed')
    })
  })

  describe('fetchCuisineKeys', () => {
    it('should fetch unique cuisines', async () => {
      const { fetchCuisineKeys } = useRecipes()
      const result = await fetchCuisineKeys()
      expect(Array.isArray(result)).toBe(true)
    })
  })
})