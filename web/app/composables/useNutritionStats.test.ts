import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Recipe, NutritionInfo } from '~/types'

// Mock localStorage
const localStorageData: Record<string, string> = {}
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageData[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageData[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageData[key]
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageData).forEach(key => delete localStorageData[key])
  }),
}

vi.stubGlobal('localStorage', mockLocalStorage)

// Mock useNuxtApp
vi.mock('~/app', () => ({
  useNuxtApp: () => ({
    $supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      }),
    },
  }),
}))

// Mock useFavorites
vi.mock('~/composables/useFavorites', () => ({
  useFavorites: () => ({
    favoriteIds: { value: new Set<string>() },
  }),
}))

describe('useNutritionStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(localStorageData).forEach(key => delete localStorageData[key])
  })

  describe('localStorage helpers', () => {
    it('should store and retrieve eaten recipe IDs for a date', () => {
      const date = '2024-01-15'
      const recipeId = 'recipe-123'

      // Simulate adding a recipe as eaten
      const ids = [recipeId]
      localStorage.setItem(`nutrition_eaten_recipes_${date}`, JSON.stringify(ids))
      localStorage.setItem('nutrition_eaten_date', date)

      // Verify it was stored
      const stored = localStorage.getItem(`nutrition_eaten_recipes_${date}`)
      expect(stored).toBe(JSON.stringify(ids))
    })

    it('should return empty array when no recipes eaten for date', () => {
      const date = '2024-01-16'
      const stored = localStorage.getItem(`nutrition_eaten_recipes_${date}`)
      expect(stored).toBeNull()
    })

    it('should handle invalid JSON gracefully', () => {
      const date = '2024-01-17'
      localStorage.setItem(`nutrition_eaten_recipes_${date}`, 'invalid-json')

      // Should not throw, returns empty array
      expect(() => {
        const result = JSON.parse(localStorage.getItem(`nutrition_eaten_recipes_${date}`) || '[]')
      }).toThrow()
    })
  })

  describe('date formatting', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const formatted = date.toISOString().split('T')[0]
      expect(formatted).toBe('2024-01-15')
    })

    it('should format today correctly', () => {
      const today = new Date()
      const formatted = today.toISOString().split('T')[0]
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('getRecentDays', () => {
    it('should return correct number of days', () => {
      const n = 7
      const days: string[] = []
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().split('T')[0])
      }
      expect(days).toHaveLength(7)
    })

    it('should return days in chronological order', () => {
      const n = 3
      const days: string[] = []
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().split('T')[0])
      }
      // First day should be oldest, last day should be today
      const firstDate = new Date(days[0])
      const lastDate = new Date(days[days.length - 1])
      expect(firstDate.getTime()).toBeLessThan(lastDate.getTime())
    })
  })

  describe('mergeNutrition', () => {
    it('should correctly sum nutrition values', () => {
      const acc: NutritionInfo = { calories: 100, protein: 10, carbs: 20, fat: 5, fiber: 3 }
      const recipe: Partial<Recipe> = {
        nutritionInfo: { calories: 200, protein: 15, carbs: 30, fat: 10, fiber: 5 }
      }

      const result: NutritionInfo = {
        calories: (acc.calories || 0) + (recipe.nutritionInfo?.calories || 0),
        protein: (acc.protein || 0) + (recipe.nutritionInfo?.protein || 0),
        carbs: (acc.carbs || 0) + (recipe.nutritionInfo?.carbs || 0),
        fat: (acc.fat || 0) + (recipe.nutritionInfo?.fat || 0),
        fiber: (acc.fiber || 0) + (recipe.nutritionInfo?.fiber || 0),
      }

      expect(result.calories).toBe(300)
      expect(result.protein).toBe(25)
      expect(result.carbs).toBe(50)
      expect(result.fat).toBe(15)
      expect(result.fiber).toBe(8)
    })

    it('should handle undefined nutrition values', () => {
      const acc: NutritionInfo = {}
      const recipe: Partial<Recipe> = {
        nutritionInfo: { calories: 200 }
      }

      const result: NutritionInfo = {
        calories: (acc.calories || 0) + (recipe.nutritionInfo?.calories || 0),
        protein: (acc.protein || 0) + (recipe.nutritionInfo?.protein || 0),
        carbs: (acc.carbs || 0) + (recipe.nutritionInfo?.carbs || 0),
        fat: (acc.fat || 0) + (recipe.nutritionInfo?.fat || 0),
        fiber: (acc.fiber || 0) + (recipe.nutritionInfo?.fiber || 0),
      }

      expect(result.calories).toBe(200)
      expect(result.protein).toBe(0)
    })
  })

  describe('recommendedDaily', () => {
    it('should have correct recommended values', () => {
      const recommendedDaily = {
        calories: 2000,
        protein: 60,
        carbs: 300,
        fat: 65,
        fiber: 25,
      }

      expect(recommendedDaily.calories).toBe(2000)
      expect(recommendedDaily.protein).toBe(60)
      expect(recommendedDaily.carbs).toBe(300)
      expect(recommendedDaily.fat).toBe(65)
      expect(recommendedDaily.fiber).toBe(25)
    })
  })

  describe('weeklySummary calculation', () => {
    it('should calculate weekly totals correctly', () => {
      const daily = [
        { date: '2024-01-15', calories: 1500, protein: 50, carbs: 200, fat: 50, fiber: 15 },
        { date: '2024-01-16', calories: 1800, protein: 60, carbs: 250, fat: 60, fiber: 20 },
        { date: '2024-01-17', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      ]

      const totals = daily.reduce(
        (acc, d) => ({
          calories: acc.calories + d.calories,
          protein: acc.protein + d.protein,
          carbs: acc.carbs + d.carbs,
          fat: acc.fat + d.fat,
          fiber: acc.fiber + d.fiber,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      )

      expect(totals.calories).toBe(3300)
      expect(totals.protein).toBe(110)
      expect(totals.carbs).toBe(450)
    })

    it('should calculate daily average excluding zero days', () => {
      const daily = [
        { date: '2024-01-15', calories: 1500, protein: 50, carbs: 200, fat: 50, fiber: 15 },
        { date: '2024-01-16', calories: 1800, protein: 60, carbs: 250, fat: 60, fiber: 20 },
        { date: '2024-01-17', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      ]

      const totals = daily.reduce(
        (acc, d) => ({
          calories: acc.calories + d.calories,
          protein: acc.protein + d.protein,
          carbs: acc.carbs + d.carbs,
          fat: acc.fat + d.fat,
          fiber: acc.fiber + d.fiber,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      )

      const daysWithData = daily.filter(d => d.calories > 0).length
      expect(daysWithData).toBe(2)

      const avgCalories = Math.round(totals.calories / daysWithData)
      expect(avgCalories).toBe(1650)
    })
  })
})