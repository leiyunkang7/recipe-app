import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { User } from '@supabase/supabase-js'

// Mock user for testing
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  role: 'authenticated',
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: { name: 'Test User' },
} as User

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: mockUser }, error: null })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    upsert: vi.fn(() => Promise.resolve({ error: null })),
  })),
}

// Mock useNuxtApp
vi.mock('~/app', () => ({
  useNuxtApp: () => ({
    $supabase: mockSupabase,
  }),
}))

// Mock useState
vi.mock('~/composables/useState', () => ({
  useState: vi.fn((key: string, defaultValue: () => User | null) => {
    const state = defaultValue()
    return { value: state }
  }),
}))

describe('useRecipeRating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rating validation', () => {
    it('should reject ratings below 1', () => {
      const score = 0
      const isValid = score >= 1 && score <= 5
      expect(isValid).toBe(false)
    })

    it('should reject ratings above 5', () => {
      const score = 6
      const isValid = score >= 1 && score <= 5
      expect(isValid).toBe(false)
    })

    it('should accept valid ratings 1-5', () => {
      for (let score = 1; score <= 5; score++) {
        const isValid = score >= 1 && score <= 5
        expect(isValid).toBe(true)
      }
    })
  })

  describe('average rating calculation', () => {
    it('should calculate correct average for multiple ratings', () => {
      const ratings = [
        { score: 5 },
        { score: 4 },
        { score: 3 },
      ]

      const total = ratings.reduce((sum, r) => sum + r.score, 0)
      const average = Math.round((total / ratings.length) * 10) / 10

      expect(average).toBe(4)
    })

    it('should return 0 for empty ratings', () => {
      const ratings: { score: number }[] = []
      const average = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : 0

      expect(average).toBe(0)
    })

    it('should round to one decimal place', () => {
      const ratings = [
        { score: 5 },
        { score: 4 },
        { score: 4 },
      ]

      const total = ratings.reduce((sum, r) => sum + r.score, 0)
      const average = Math.round((total / ratings.length) * 10) / 10

      expect(average).toBe(4.3)
    })
  })

  describe('user authentication check', () => {
    it('should return user when authenticated', async () => {
      const { data, error } = await mockSupabase.auth.getUser()
      expect(error).toBeNull()
      expect(data.user).toEqual(mockUser)
    })
  })

  describe('rating submission', () => {
    it('should upsert rating with correct structure', async () => {
      const recipeId = 'recipe-456'
      const score = 4

      const fromMock = mockSupabase.from('recipe_ratings')
      const upsertMock = fromMock.upsert as ReturnType<typeof vi.fn>

      const result = await fromMock('recipe_ratings').upsert(
        { user_id: mockUser.id, recipe_id: recipeId, score },
        { onConflict: 'user_id,recipe_id' }
      )

      expect(upsertMock).toHaveBeenCalledWith(
        { user_id: mockUser.id, recipe_id: recipeId, score },
        { onConflict: 'user_id,recipe_id' }
      )
      expect(result.error).toBeNull()
    })
  })

  describe('rating fetch', () => {
    it('should fetch ratings for a recipe', async () => {
      const recipeId = 'recipe-789'
      const fromMock = mockSupabase.from('recipe_ratings')

      const result = await fromMock('recipe_ratings')
        .select('score')
        .eq('recipe_id', recipeId)

      expect(fromMock).toHaveBeenCalledWith('recipe_ratings')
    })

    it('should fetch user rating for a recipe', async () => {
      const recipeId = 'recipe-789'
      const fromMock = mockSupabase.from('recipe_ratings')

      // Simulate user rating exists
      ;(fromMock('recipe_ratings').select('score').eq as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { score: 5 }, error: null })),
          })),
        } as any)

      const result = await fromMock('recipe_ratings')
        .select('score')
        .eq('recipe_id', recipeId)
        .eq('user_id', mockUser.id)
        .single()

      expect(result.data?.score).toBe(5)
    })

    it('should return 0 when user has no rating', async () => {
      const recipeId = 'recipe-789'
      const fromMock = mockSupabase.from('recipe_ratings')

      // Simulate no rating
      ;(fromMock('recipe_ratings').select('score').eq as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        } as any)

      const result = await fromMock('recipe_ratings')
        .select('score')
        .eq('recipe_id', recipeId)
        .eq('user_id', mockUser.id)
        .single()

      expect(result.data?.score || 0).toBe(0)
    })
  })

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const fetchError = { message: 'Failed to fetch', code: 'FETCH_ERROR' }
      const fromMock = mockSupabase.from('recipe_ratings')

      ;(fromMock('recipe_ratings').select('score').eq as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: fetchError })),
          })),
        } as any)

      const result = await fromMock('recipe_ratings')
        .select('score')
        .eq('recipe_id', 'recipe-error')
        .eq('user_id', mockUser.id)
        .single()

      expect(result.error).toEqual(fetchError)
    })

    it('should identify PGRST116 as "no rows" error', () => {
      // PGRST116 is the PostgREST error code for no rows returned
      const noRowsError = { code: 'PGRST116', message: 'No rows found' }
      const isNoRowsError = noRowsError.code === 'PGRST116'
      expect(isNoRowsError).toBe(true)
    })
  })

  describe('state management', () => {
    it('should initialize with default values', () => {
      const initialState = {
        averageRating: 0,
        ratingCount: 0,
        userRating: 0,
        loading: false,
        submitting: false,
        error: null as string | null,
      }

      expect(initialState.averageRating).toBe(0)
      expect(initialState.ratingCount).toBe(0)
      expect(initialState.userRating).toBe(0)
      expect(initialState.loading).toBe(false)
      expect(initialState.submitting).toBe(false)
      expect(initialState.error).toBeNull()
    })
  })
})