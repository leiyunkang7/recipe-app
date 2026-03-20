import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

const mockFrom = vi.fn()
const mockSelect = vi.fn().mockReturnThis()
const mockInsert = vi.fn().mockReturnThis()
const mockUpdate = vi.fn().mockReturnThis()
const mockDelete = vi.fn().mockReturnThis()
const mockEq = vi.fn().mockReturnThis()
const mockOrder = vi.fn().mockReturnThis()
const mockNot = vi.fn().mockReturnThis()
const mockIlike = vi.fn().mockReturnThis()
const mockSingle = vi.fn().mockReturnThis()

mockFrom.mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
})

vi.mock('#imports', () => ({
  useNuxtApp: vi.fn(() => ({
    $supabase: {
      from: mockFrom,
    },
  })),
  useI18n: vi.fn(() => ({
    locale: ref('en'),
  })),
}))

vi.spyOn(console, 'error').mockImplementation(() => {})

describe('useRecipes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelect.mockReturnThis()
    mockInsert.mockReturnThis()
    mockUpdate.mockReturnThis()
    mockDelete.mockReturnThis()
    mockEq.mockReturnValue({
      order: mockOrder,
    })
    mockOrder.mockReturnThis()
    mockNot.mockReturnThis()
    mockIlike.mockReturnThis()
    mockSingle.mockReset()
    
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })
  })

  describe('initial state', () => {
    it('should have recipes as empty array initially', async () => {
      const { useRecipes } = await import('../app/composables/useRecipes')
      const { recipes } = useRecipes()
      expect(Array.isArray(recipes.value)).toBe(true)
      expect(recipes.value).toHaveLength(0)
    })

    it('should have loading set to false initially', async () => {
      const { useRecipes } = await import('../app/composables/useRecipes')
      const { loading } = useRecipes()
      expect(loading.value).toBe(false)
    })

    it('should have error set to null initially', async () => {
      const { useRecipes } = await import('../app/composables/useRecipes')
      const { error } = useRecipes()
      expect(error.value).toBe(null)
    })

    it('should have currentLocale set based on i18n', async () => {
      const { useRecipes } = await import('../app/composables/useRecipes')
      const { currentLocale } = useRecipes()
      expect(currentLocale.value).toBe('en')
    })
  })

  describe('fetchRecipes', () => {
    it('should set loading to true when fetching', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchRecipes, loading } = useRecipes()

      const fetchPromise = fetchRecipes()
      expect(loading.value).toBe(true)
      await fetchPromise
    })

    it('should set loading to false after fetch completes', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchRecipes, loading } = useRecipes()

      await fetchRecipes()
      expect(loading.value).toBe(false)
    })

    it('should set error on fetch failure', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
        }),
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchRecipes, error } = useRecipes()

      await fetchRecipes()
      expect(error.value).toBe('Database error')
    })

    it('should call supabase with recipes table', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchRecipes } = useRecipes()

      await fetchRecipes()
      expect(mockFrom).toHaveBeenCalledWith('recipes')
    })
  })

  describe('fetchRecipeById', () => {
    it('should call supabase with correct table and id', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116', message: 'Not found' } 
          }),
        }),
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchRecipeById } = useRecipes()

      await fetchRecipeById('test-id')
      
      expect(mockFrom).toHaveBeenCalledWith('recipes')
    })

    it('should return null when recipe not found', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116', message: 'Not found' } 
          }),
        }),
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchRecipeById } = useRecipes()

      const result = await fetchRecipeById('non-existent-id')
      expect(result).toBeNull()
    })

    it('should set error to "Recipe not found" when PGRST116 error', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116', message: 'Not found' } 
          }),
        }),
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchRecipeById, error } = useRecipes()

      await fetchRecipeById('non-existent-id')
      expect(error.value).toBe('Recipe not found')
    })
  })

  describe('deleteRecipe', () => {
    it('should return true on successful deletion', async () => {
      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { deleteRecipe } = useRecipes()

      const result = await deleteRecipe('recipe-id')
      expect(result).toBe(true)
    })

    it('should return false on deletion failure', async () => {
      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { deleteRecipe } = useRecipes()

      const result = await deleteRecipe('recipe-id')
      expect(result).toBe(false)
    })

    it('should set loading state during deletion', async () => {
      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { deleteRecipe, loading } = useRecipes()

      const deletePromise = deleteRecipe('recipe-id')
      expect(loading.value).toBe(true)
      await deletePromise
      expect(loading.value).toBe(false)
    })
  })

  describe('fetchCategories', () => {
    it('should return array of category names', async () => {
      mockSelect.mockResolvedValue({ 
        data: [
          { id: 1, name: 'Main', category_translations: [{ locale: 'en', name: 'Main Course' }] },
          { id: 2, name: 'Dessert', category_translations: [{ locale: 'en', name: 'Dessert' }] },
        ], 
        error: null 
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchCategories } = useRecipes()

      const result = await fetchCategories()
      expect(result).toEqual(['Main Course', 'Dessert'])
    })

    it('should return empty array on error', async () => {
      mockSelect.mockResolvedValue({ data: null, error: { message: 'Error' } })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchCategories } = useRecipes()

      const result = await fetchCategories()
      expect(result).toEqual([])
    })

    it('should fall back to name when translation not found', async () => {
      mockSelect.mockResolvedValue({ 
        data: [
          { id: 1, name: 'Main', category_translations: [] },
        ], 
        error: null 
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchCategories } = useRecipes()

      const result = await fetchCategories()
      expect(result).toEqual(['Main'])
    })
  })

  describe('fetchCuisines', () => {
    it('should return array of cuisine names', async () => {
      mockSelect.mockResolvedValue({ 
        data: [
          { id: 1, name: 'Italian', cuisine_translations: [{ locale: 'en', name: 'Italian' }] },
          { id: 2, name: 'Chinese', cuisine_translations: [{ locale: 'en', name: 'Chinese' }] },
        ], 
        error: null 
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchCuisines } = useRecipes()

      const result = await fetchCuisines()
      expect(result).toEqual(['Italian', 'Chinese'])
    })

    it('should return empty array on error', async () => {
      mockSelect.mockResolvedValue({ data: null, error: { message: 'Error' } })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchCuisines } = useRecipes()

      const result = await fetchCuisines()
      expect(result).toEqual([])
    })
  })

  describe('fetchCategoryKeys', () => {
    it('should return category keys with display names', async () => {
      let callCount = 0
      mockSelect.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({ 
            data: [{ category: 'Main' }, { category: 'Dessert' }], 
            error: null 
          })
        }
        return Promise.resolve({ 
          data: [
            { name: 'Main', category_translations: [{ locale: 'en', name: 'Main Course' }] },
            { name: 'Dessert', category_translations: [{ locale: 'en', name: 'Dessert' }] },
          ], 
          error: null 
        })
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchCategoryKeys } = useRecipes()

      const result = await fetchCategoryKeys()
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('fetchCuisineKeys', () => {
    it('should return cuisine keys with display names', async () => {
      mockSelect.mockResolvedValue({ 
        data: [
          { id: 1, name: 'Italian', cuisine_translations: [{ locale: 'en', name: 'Italian' }] },
          { id: 2, name: 'Chinese', cuisine_translations: [{ locale: 'en', name: 'Chinese' }] },
        ], 
        error: null 
      })

      const { useRecipes } = await import('../app/composables/useRecipes')
      const { fetchCuisineKeys } = useRecipes()

      const result = await fetchCuisineKeys()
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
