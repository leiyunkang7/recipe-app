import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, computed } from 'vue'
import type { Recipe, Ingredient, RecipeStep } from '~/types'

// Mock Nuxt imports
vi.mock('#imports', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'app.title': '食谱大全',
        'app.subtitle': '发现美味食谱',
        'unit.minutes': '分钟',
        'unit.servings': '份',
        'difficulty.easy': '简单',
        'difficulty.medium': '中等',
        'difficulty.hard': '困难',
      }
      return translations[key] || key
    },
    locale: ref('zh-CN'),
  })),
  useRuntimeConfig: vi.fn(() => ({
    public: {
      supabaseUrl: 'https://test.supabase.co/rest/v1',
    },
  })),
  useSeoMeta: vi.fn(),
  useHead: vi.fn(),
  watchEffect: vi.fn((fn: () => void) => fn()),
}))

describe('useRecipeSeo', () => {
  const mockRecipe: Recipe = {
    id: 'recipe-123',
    title: '番茄炒蛋',
    description: '一道简单美味的家常菜',
    category: '家常菜',
    cuisine: '中餐',
    difficulty: 'easy',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 4,
    imageUrl: '/images/tomato-eggs.jpg',
    tags: ['快手菜', '家常', '下饭'],
    ingredients: [
      { name: '番茄', amount: 2, unit: '个' },
      { name: '鸡蛋', amount: 3, unit: '个' },
      { name: '盐', amount: 1, unit: '勺' },
      { name: '糖', amount: 1, unit: '勺' },
    ],
    steps: [
      { stepNumber: 1, instruction: '打散鸡蛋' },
      { stepNumber: 2, instruction: '炒番茄' },
      { stepNumber: 3, instruction: '加入鸡蛋翻炒' },
      { stepNumber: 4, instruction: '调味出锅' },
    ],
    rating: 4.5,
    ratingCount: 100,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T12:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('pageTitle', () => {
    it('should return recipe title with app title when recipe exists', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeRef = ref<Recipe | null>(mockRecipe)
      const totalTime = computed(() => 25)

      const { pageTitle } = useRecipeSeo(recipeRef, totalTime)

      expect(pageTitle.value).toBe('番茄炒蛋 - 食谱大全')
    })

    it('should return only app title when recipe is null', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeRef = ref<Recipe | null>(null)
      const totalTime = computed(() => 0)

      const { pageTitle } = useRecipeSeo(recipeRef, totalTime)

      expect(pageTitle.value).toBe('食谱大全')
    })
  })

  describe('metaDescription', () => {
    it('should include category, time, difficulty, and servings in description', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeRef = ref<Recipe | null>(mockRecipe)
      const totalTime = computed(() => 25)

      const { metaDescription } = useRecipeSeo(recipeRef, totalTime)

      expect(metaDescription.value).toContain('番茄炒蛋')
      expect(metaDescription.value).toContain('家常菜')
      expect(metaDescription.value).toContain('25分钟')
      expect(metaDescription.value).toContain('4份')
    })

    it('should return app subtitle when recipe is null', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeRef = ref<Recipe | null>(null)
      const totalTime = computed(() => 0)

      const { metaDescription } = useRecipeSeo(recipeRef, totalTime)

      expect(metaDescription.value).toBe('发现美味食谱')
    })

    it('should return description when recipe has no other metadata', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const minimalRecipe: Recipe = {
        ...mockRecipe,
        category: '家常菜',
        cuisine: undefined,
        tags: [],
      }
      const recipeRef = ref<Recipe | null>(minimalRecipe)
      const totalTime = computed(() => 0)

      const { metaDescription } = useRecipeSeo(recipeRef, totalTime)

      expect(metaDescription.value).toContain('一道简单美味的家常菜')
    })
  })

  describe('seoKeywords', () => {
    it('should combine title, category, cuisine, and tags', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeRef = ref<Recipe | null>(mockRecipe)
      const totalTime = computed(() => 25)

      const { seoKeywords } = useRecipeSeo(recipeRef, totalTime)

      expect(seoKeywords.value).toContain('番茄炒蛋')
      expect(seoKeywords.value).toContain('家常菜')
      expect(seoKeywords.value).toContain('中餐')
      expect(seoKeywords.value).toContain('快手菜')
      expect(seoKeywords.value).toContain('家常')
      expect(seoKeywords.value).toContain('下饭')
    })

    it('should return empty string when recipe is null', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeRef = ref<Recipe | null>(null)
      const totalTime = computed(() => 0)

      const { seoKeywords } = useRecipeSeo(recipeRef, totalTime)

      expect(seoKeywords.value).toBe('')
    })

    it('should filter out undefined fields', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeWithoutCuisine: Recipe = { ...mockRecipe, cuisine: undefined }
      const recipeRef = ref<Recipe | null>(recipeWithoutCuisine)
      const totalTime = computed(() => 25)

      const { seoKeywords } = useRecipeSeo(recipeRef, totalTime)

      expect(seoKeywords.value).not.toContain('undefined')
    })
  })
})