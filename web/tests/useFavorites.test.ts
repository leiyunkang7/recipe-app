import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockSelect = vi.fn().mockReturnThis()
const mockInsert = vi.fn().mockReturnThis()
const mockDelete = vi.fn().mockReturnThis()
const mockEq = vi.fn().mockReturnThis()
const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
  delete: mockDelete,
})

const mockAuthGetUser = vi.fn()

vi.mock('#imports', () => ({
  useNuxtApp: vi.fn(() => ({
    $supabase: {
      from: mockFrom,
      auth: {
        getUser: mockAuthGetUser,
      },
    },
  })),
  useI18n: vi.fn(() => ({
    locale: ref('en'),
  })),
}))

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
})

describe('useFavorites', () => {
  const testUser = { id: 'user-123', email: 'test@example.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthGetUser.mockResolvedValue({ data: { user: testUser }, error: null })
    mockSelect.mockReset()
    mockInsert.mockReset()
    mockDelete.mockReset()
    mockEq.mockReset()
  })

  describe('initial state', () => {
    it('should have favoriteIds as empty Set initially', async () => {
      const { useFavorites } = await import('../app/composables/useFavorites')
      const { favoriteIds } = useFavorites()

      expect(favoriteIds.value).toBeInstanceOf(Set)
      expect(favoriteIds.value.size).toBe(0)
    })

    it('should have loading as false initially', async () => {
      const { useFavorites } = await import('../app/composables/useFavorites')
      const { loading } = useFavorites()

      expect(loading.value).toBe(false)
    })
  })

  describe('isFavorite', () => {
    it('should return false when recipeId is not in favorites', async () => {
      const { useFavorites } = await import('../app/composables/useFavorites')
      const { isFavorite } = useFavorites()

      expect(isFavorite('recipe-1')).toBe(false)
    })
  })

  describe('fetchFavoriteIds', () => {
    it('should populate favoriteIds from database', async () => {
      mockSelect.mockResolvedValue({
        data: [
          { recipe_id: 'recipe-1' },
          { recipe_id: 'recipe-2' },
        ],
        error: null,
      })

      const { useFavorites } = await import('../app/composables/useFavorites')
      const { fetchFavoriteIds, favoriteIds } = useFavorites()

      await fetchFavoriteIds('user-123')

      expect(mockFrom).toHaveBeenCalledWith('favorites')
      expect(mockSelect).toHaveBeenCalledWith('recipe_id')
      expect(favoriteIds.value.has('recipe-1')).toBe(true)
      expect(favoriteIds.value.has('recipe-2')).toBe(true)
    })

    it('should handle errors gracefully', async () => {
      mockSelect.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const { useFavorites } = await import('../app/composables/useFavorites')
      const { fetchFavoriteIds, favoriteIds } = useFavorites()

      await fetchFavoriteIds('user-123')

      // Should not throw, and favoriteIds should remain empty
      expect(favoriteIds.value.size).toBe(0)
    })
  })

  describe('toggleFavorite', () => {
    it('should do nothing when user is not authenticated', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: null })

      const { useFavorites } = await import('../app/composables/useFavorites')
      const { toggleFavorite } = useFavorites()

      await toggleFavorite('recipe-1')

      // Should not call any database operations
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('should add favorite when not already favorited', async () => {
      mockEq.mockResolvedValue({ error: null })
      mockInsert.mockReturnValue({
        eq: mockEq,
      })

      const { useFavorites } = await import('../app/composables/useFavorites')
      const { toggleFavorite, favoriteIds } = useFavorites()

      // Initially not favorited
      expect(favoriteIds.value.has('recipe-1')).toBe(false)

      await toggleFavorite('recipe-1')

      expect(mockFrom).toHaveBeenCalledWith('favorites')
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should remove favorite when already favorited', async () => {
      mockEq.mockResolvedValue({ error: null })
      mockDelete.mockReturnValue({
        eq: mockEq,
      })

      const { useFavorites } = await import('../app/composables/useFavorites')
      const { toggleFavorite, favoriteIds, fetchFavoriteIds } = useFavorites()

      // First fetch to populate favorites
      mockSelect.mockResolvedValue({
        data: [{ recipe_id: 'recipe-1' }],
        error: null,
      })
      await fetchFavoriteIds('user-123')

      expect(favoriteIds.value.has('recipe-1')).toBe(true)

      // Toggle to remove
      await toggleFavorite('recipe-1')

      expect(mockDelete).toHaveBeenCalled()
    })
  })

  describe('addFavorite', () => {
    it('should add recipe to favorites', async () => {
      mockInsert.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockResolvedValue({ error: null })

      const { useFavorites } = await import('../app/composables/useFavorites')
      const { addFavorite, favoriteIds } = useFavorites()

      await addFavorite('recipe-new')

      expect(favoriteIds.value.has('recipe-new')).toBe(true)
    })

    it('should not duplicate if already favorited', async () => {
      mockSelect.mockResolvedValue({
        data: [{ recipe_id: 'recipe-1' }],
        error: null,
      })

      const { useFavorites } = await import('../app/composables/useFavorites')
      const { addFavorite, favoriteIds, fetchFavoriteIds } = useFavorites()

      // First fetch to populate favorites
      await fetchFavoriteIds('user-123')

      const initialSize = favoriteIds.value.size

      // Try to add same recipe
      await addFavorite('recipe-1')

      // Size should remain the same
      expect(favoriteIds.value.size).toBe(initialSize)
    })
  })

  describe('removeFavorite', () => {
    it('should remove recipe from favorites', async () => {
      mockSelect.mockResolvedValue({
        data: [{ recipe_id: 'recipe-1' }],
        error: null,
      })
      mockDelete.mockReturnValue({
        eq: mockEq,
      })
      mockEq.mockResolvedValue({ error: null })

      const { useFavorites } = await import('../app/composables/useFavorites')
      const { removeFavorite, favoriteIds, fetchFavoriteIds } = useFavorites()

      // First fetch to populate favorites
      await fetchFavoriteIds('user-123')
      expect(favoriteIds.value.has('recipe-1')).toBe(true)

      // Remove
      await removeFavorite('recipe-1')

      expect(favoriteIds.value.has('recipe-1')).toBe(false)
    })

    it('should do nothing if recipe not in favorites', async () => {
      const { useFavorites } = await import('../app/composables/useFavorites')
      const { removeFavorite, favoriteIds } = useFavorites()

      await removeFavorite('non-existent-recipe')

      // favoriteIds should remain empty
      expect(favoriteIds.value.size).toBe(0)
    })
  })
})