import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, computed } from 'vue'
import type { Recipe } from '~/types'

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
    ingredients: ['番茄', '鸡蛋', '盐', '糖'],
    steps: ['打散鸡蛋', '炒番茄', '加入鸡蛋翻炒', '调味出锅'],
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
        category: undefined,
        difficulty: undefined,
        servings: undefined,
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

  describe('ogUrl', () => {
    it('should generate correct URL with locale prefix', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeRef = ref<Recipe | null>(mockRecipe)
      const totalTime = computed(() => 25)

      const { ogUrl } = useRecipeSeo(recipeRef, totalTime)

      expect(ogUrl.value).toContain('/zh-CN/recipes/recipe-123')
      expect(ogUrl.value).toContain('https://test.supabase.co')
    })

    it('should generate English URL when locale is en', async () => {
      vi.mocked(useI18n).mockReturnValue({
        t: (key: string) => key,
        locale: ref('en'),
      })

      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeRef = ref<Recipe | null>(mockRecipe)
      const totalTime = computed(() => 25)

      const { ogUrl } = useRecipeSeo(recipeRef, totalTime)

      expect(ogUrl.value).toContain('/en/recipes/recipe-123')
    })
  })

  describe('ogImageAbsolute', () => {
    it('should return absolute URL when image starts with http', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeWithHttpImage: Recipe = {
        ...mockRecipe,
        imageUrl: 'https://example.com/image.jpg',
      }
      const recipeRef = ref<Recipe | null>(recipeWithHttpImage)
      const totalTime = computed(() => 25)

      const { ogImageAbsolute } = useRecipeSeo(recipeRef, totalTime)

      expect(ogImageAbsolute.value).toBe('https://example.com/image.jpg')
    })

    it('should prepend baseUrl for relative paths', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeRef = ref<Recipe | null>(mockRecipe)
      const totalTime = computed(() => 25)

      const { ogImageAbsolute } = useRecipeSeo(recipeRef, totalTime)

      expect(ogImageAbsolute.value).toBe('https://test.supabase.co/images/tomato-eggs.jpg')
    })

    it('should return default icon when image is null', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeWithoutImage: Recipe = { ...mockRecipe, imageUrl: undefined }
      const recipeRef = ref<Recipe | null>(recipeWithoutImage)
      const totalTime = computed(() => 25)

      const { ogImageAbsolute } = useRecipeSeo(recipeRef, totalTime)

      expect(ogImageAbsolute.value).toBe('https://test.supabase.co/icon.png')
    })
  })

  describe('jsonLd', () => {
    it('should generate valid JSON-LD structured data', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeRef = ref<Recipe | null>(mockRecipe)
      const totalTime = computed(() => 25)

      const { jsonLd } = useRecipeSeo(recipeRef, totalTime)

      expect(jsonLd.value).not.toBeNull()
      expect(jsonLd.value['@context']).toBe('https://schema.org')
      expect(jsonLd.value['@type']).toBe('Recipe')
      expect(jsonLd.value.name).toBe('番茄炒蛋')
      expect(jsonLd.value.cookTime).toBe('PT15M')
      expect(jsonLd.value.prepTime).toBe('PT10M')
      expect(jsonLd.value.totalTime).toBe('PT25M')
    })

    it('should handle string ingredients', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeRef = ref<Recipe | null>(mockRecipe)
      const totalTime = computed(() => 25)

      const { jsonLd } = useRecipeSeo(recipeRef, totalTime)

      expect(jsonLd.value.recipeIngredient).toEqual(['番茄', '鸡蛋', '盐', '糖'])
    })

    it('should handle object ingredients with amount and name', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeWithObjectIngredients: Recipe = {
        ...mockRecipe,
        ingredients: [
          { name: '番茄', amount: '2个' },
          { name: '鸡蛋', amount: '3个' },
        ],
      }
      const recipeRef = ref<Recipe | null>(recipeWithObjectIngredients)
      const totalTime = computed(() => 25)

      const { jsonLd } = useRecipeSeo(recipeRef, totalTime)

      expect(jsonLd.value.recipeIngredient).toEqual(['2个 番茄', '3个 鸡蛋'])
    })

    it('should include nutrition info when available', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeWithNutrition: Recipe = {
        ...mockRecipe,
        nutritionInfo: {
          calories: 200,
          protein: 15,
          carbs: 10,
          fat: 8,
          fiber: 2,
        },
      }
      const recipeRef = ref<Recipe | null>(recipeWithNutrition)
      const totalTime = computed(() => 25)

      const { jsonLd } = useRecipeSeo(recipeRef, totalTime)

      expect(jsonLd.value.nutrition).toBeDefined()
      expect(jsonLd.value.nutrition['@type']).toBe('NutritionInformation')
      expect(jsonLd.value.nutrition.calories).toBe('200 calories')
      expect(jsonLd.value.nutrition.proteinContent).toBe('15g')
    })

    it('should include aggregate rating when rating exists', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeRef = ref<Recipe | null>(mockRecipe)
      const totalTime = computed(() => 25)

      const { jsonLd } = useRecipeSeo(recipeRef, totalTime)

      expect(jsonLd.value.aggregateRating).toBeDefined()
      expect(jsonLd.value.aggregateRating.ratingValue).toBe('4.5')
      expect(jsonLd.value.aggregateRating.ratingCount).toBe('100')
    })

    it('should return null when recipe is null', async () => {
      const { useRecipeSeo } = await import('./useRecipeSeo')
      const recipeRef = ref<Recipe | null>(null)
      const totalTime = computed(() => 0)

      const { jsonLd } = useRecipeSeo(recipeRef, totalTime)

      expect(jsonLd.value).toBeNull()
    })
  })
})