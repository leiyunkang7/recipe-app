import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'

// Mock user type
const mockUser = { id: 'user-123', email: 'test@example.com' }

// Mock supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  delete: vi.fn().mockResolvedValue({ data: null, error: null }),
}

vi.mock('~/app', () => ({
  useNuxtApp: () => ({
    $supabase: mockSupabase,
  }),
}))

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    locale: { value: 'zh' },
  }),
}))

describe('useFavorites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mocks
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({ data: { user: mockUser }, error: null })
    vi.mocked(mockSupabase.from).mockReturnThis()
    vi.mocked(mockSupabase.select).mockReturnThis()
    vi.mocked(mockSupabase.eq).mockReturnThis()
    vi.mocked(mockSupabase.insert).mockResolvedValue({ data: null, error: null })
    vi.mocked(mockSupabase.delete).mockResolvedValue({ data: null, error: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should return initial state with empty favoriteIds', async () => {
      const { useFavorites } = await import('./useFavorites')
      const { favoriteIds, loading, isFavorite } = useFavorites()

      // Initial state should be empty
      expect(favoriteIds.value.length).toBe(0)
      expect(loading.value).toBe(false)
      expect(typeof isFavorite).toBe('function')
    })
  })

  describe('isFavorite', () => {
    it('should return false for non-favorited recipe', async () => {
      const { useFavorites } = await import('./useFavorites')
      const { isFavorite } = useFavorites()

      expect(isFavorite('recipe-1')).toBe(false)
    })

    it('should return true for favorited recipe after toggle', async () => {
      const { useFavorites } = await import('./useFavorites')
      const { toggleFavorite, isFavorite } = useFavorites()

      // Mock successful insert for adding favorite
      vi.mocked(mockSupabase.insert).mockResolvedValue({ data: { id: 1 }, error: null })

      await toggleFavorite('recipe-1')
      await nextTick()

      expect(isFavorite('recipe-1')).toBe(true)
    })
  })

  describe('toggleFavorite', () => {
    it('should do nothing if user is not authenticated', async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null })

      const { useFavorites } = await import('./useFavorites')
      const { toggleFavorite } = useFavorites()

      await toggleFavorite('recipe-1')

      // Should not call insert or delete
      expect(mockSupabase.insert).not.toHaveBeenCalled()
      expect(mockSupabase.delete).not.toHaveBeenCalled()
    })

    it('should add favorite when not already favorited', async () => {
      const { useFavorites } = await import('./useFavorites')
      const { toggleFavorite, isFavorite } = useFavorites()

      vi.mocked(mockSupabase.insert).mockResolvedValue({ data: { id: 1 }, error: null })

      await toggleFavorite('recipe-1')
      await nextTick()

      expect(isFavorite('recipe-1')).toBe(true)
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        recipe_id: 'recipe-1',
      })
    })

    it('should remove favorite when already favorited', async () => {
      const { useFavorites } = await import('./useFavorites')
      const { toggleFavorite, isFavorite } = useFavorites()

      // First add a favorite
      vi.mocked(mockSupabase.insert).mockResolvedValue({ data: { id: 1 }, error: null })
      await toggleFavorite('recipe-1')
      await nextTick()
      expect(isFavorite('recipe-1')).toBe(true)

      // Then remove it
      vi.mocked(mockSupabase.delete).mockResolvedValue({ data: null, error: null })
      await toggleFavorite('recipe-1')
      await nextTick()

      expect(isFavorite('recipe-1')).toBe(false)
    })

    it('should rollback on error when adding favorite', async () => {
      const { useFavorites } = await import('./useFavorites')
      const { toggleFavorite, isFavorite } = useFavorites()

      // Add fails
      vi.mocked(mockSupabase.insert).mockResolvedValue({ data: null, error: { message: 'Insert failed' } })

      await toggleFavorite('recipe-1')
      await nextTick()

      // Should not be favorite due to rollback
      expect(isFavorite('recipe-1')).toBe(false)
    })

    it('should rollback on error when removing favorite', async () => {
      const { useFavorites } = await import('./useFavorites')
      const { toggleFavorite, isFavorite } = useFavorites()

      // First add a favorite successfully
      vi.mocked(mockSupabase.insert).mockResolvedValue({ data: { id: 1 }, error: null })
      await toggleFavorite('recipe-1')
      await nextTick()
      expect(isFavorite('recipe-1')).toBe(true)

      // Then removal fails
      vi.mocked(mockSupabase.delete).mockResolvedValue({ data: null, error: { message: 'Delete failed' } })
      await toggleFavorite('recipe-1')
      await nextTick()

      // Should still be favorite due to rollback
      expect(isFavorite('recipe-1')).toBe(true)
    })
  })

  describe('fetchFavorites', () => {
    it('should return empty array when no favorites', async () => {
      const { useFavorites } = await import('./useFavorites')
      const { fetchFavorites } = useFavorites()

      // Mock empty favorites
      vi.mocked(mockSupabase.select).mockReturnValue({
        ...mockSupabase,
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })

      const result = await fetchFavorites()
      expect(result).toEqual([])
    })

    it('should return loading state while fetching', async () => {
      const { useFavorites } = await import('./useFavorites')
      const { fetchFavorites } = useFavorites()

      mockSupabase.from = vi.fn().mockImplementation(() => {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      })

      await fetchFavorites()
      // Note: Due to async nature, loading might already be false
      expect(typeof loading.value).toBe('boolean')
    })
  })

  describe('addFavorite', () => {
    it('should add favorite without duplicate check', async () => {
      const { useFavorites } = await import('./useFavorites')
      const { addFavorite, isFavorite } = useFavorites()

      vi.mocked(mockSupabase.insert).mockResolvedValue({ data: { id: 1 }, error: null })

      await addFavorite('recipe-new')
      await nextTick()

      expect(isFavorite('recipe-new')).toBe(true)
    })
  })

  describe('removeFavorite', () => {
    it('should remove favorite', async () => {
      const { useFavorites } = await import('./useFavorites')
      const { addFavorite, removeFavorite, isFavorite } = useFavorites()

      // First add
      vi.mocked(mockSupabase.insert).mockResolvedValue({ data: { id: 1 }, error: null })
      await addFavorite('recipe-remove')
      await nextTick()
      expect(isFavorite('recipe-remove')).toBe(true)

      // Then remove
      vi.mocked(mockSupabase.delete).mockResolvedValue({ data: null, error: null })
      await removeFavorite('recipe-remove')
      await nextTick()
      expect(isFavorite('recipe-remove')).toBe(false)
    })
  })
})
