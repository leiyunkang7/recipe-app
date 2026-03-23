import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
})

describe('useSharePosterLogic', () => {
  const createMockRecipe = (overrides = {}) => ({
    id: 'recipe-1',
    title: 'Test Recipe',
    description: 'A delicious test recipe',
    category: '家常菜',
    cuisine: 'Chinese',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    difficulty: 'medium' as const,
    imageUrl: 'https://example.com/image.jpg',
    ingredients: [
      { id: '1', name: 'Ingredient 1', amount: 100, unit: 'g' },
      { id: '2', name: 'Ingredient 2', amount: 200, unit: 'ml' },
      { id: '3', name: 'Ingredient 3', amount: 1, unit: '个' },
      { id: '4', name: 'Ingredient 4', amount: 50, unit: 'g' },
      { id: '5', name: 'Ingredient 5', amount: 2, unit: '勺' },
      { id: '6', name: 'Ingredient 6', amount: 30, unit: 'g' },
    ],
    tags: ['tag1', 'tag2'],
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('totalTime', () => {
    it('should calculate total time from prep and cook time', async () => {
      const recipe = createMockRecipe({ prepTimeMinutes: 15, cookTimeMinutes: 30 })

      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(recipe)

      expect(result.totalTime.value).toBe(45)
    })

    it('should handle zero prep and cook time', async () => {
      const recipe = createMockRecipe({ prepTimeMinutes: 0, cookTimeMinutes: 0 })

      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(recipe)

      expect(result.totalTime.value).toBe(0)
    })

    it('should handle undefined prep and cook time', async () => {
      const recipe = createMockRecipe({ prepTimeMinutes: undefined, cookTimeMinutes: undefined }) as any

      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(recipe)

      expect(result.totalTime.value).toBe(0)
    })
  })

  describe('difficultyConfig', () => {
    it('should return correct config for easy difficulty', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(createMockRecipe({ difficulty: 'easy' }))

      expect(result.difficultyConfig.value.label).toBe('简单')
      expect(result.difficultyConfig.value.bg).toBe('bg-green-500')
      expect(result.difficultyConfig.value.text).toBe('text-white')
    })

    it('should return correct config for medium difficulty', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(createMockRecipe({ difficulty: 'medium' }))

      expect(result.difficultyConfig.value.label).toBe('中等')
      expect(result.difficultyConfig.value.bg).toBe('bg-amber-500')
    })

    it('should return correct config for hard difficulty', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(createMockRecipe({ difficulty: 'hard' }))

      expect(result.difficultyConfig.value.label).toBe('困难')
      expect(result.difficultyConfig.value.bg).toBe('bg-red-500')
    })

    it('should return unknown for invalid difficulty', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(createMockRecipe({ difficulty: 'invalid' as any }))

      expect(result.difficultyConfig.value.label).toBe('未知')
      expect(result.difficultyConfig.value.bg).toBe('bg-gray-500')
    })
  })

  describe('topIngredients', () => {
    it('should return first 5 ingredients', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(createMockRecipe())

      expect(result.topIngredients.value).toHaveLength(5)
      expect(result.topIngredients.value[0].name).toBe('Ingredient 1')
    })

    it('should format amount and unit correctly', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(createMockRecipe())

      expect(result.topIngredients.value[0].amount).toBe('100g')
      expect(result.topIngredients.value[1].amount).toBe('200ml')
      expect(result.topIngredients.value[2].amount).toBe('1个')
    })

    it('should handle fewer than 5 ingredients', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const recipe = createMockRecipe({
        ingredients: [
          { id: '1', name: 'Ingredient 1', amount: 100, unit: 'g' },
          { id: '2', name: 'Ingredient 2', amount: 200, unit: 'ml' },
        ],
      })

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(recipe)

      expect(result.topIngredients.value).toHaveLength(2)
    })
  })

  describe('servingsText', () => {
    it('should return correct servings text', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(createMockRecipe({ servings: 4 }))

      expect(result.servingsText.value).toBe('4人份')
    })
  })

  describe('gradientColors', () => {
    it('should return correct colors for 家常菜 category', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(createMockRecipe({ category: '家常菜' }))

      expect(result.gradientColors.value).toEqual(['#FF6B35', '#F7C59F'])
    })

    it('should return correct colors for 甜点 category', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(createMockRecipe({ category: '甜点' }))

      expect(result.gradientColors.value).toEqual(['#FF69B4', '#FFC1E3'])
    })

    it('should return default colors for unknown category', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(createMockRecipe({ category: 'Unknown Category' }))

      expect(result.gradientColors.value).toEqual(['#f97316', '#fde68a'])
    })
  })

  describe('timeText', () => {
    it('should format time less than 60 minutes', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const recipe = createMockRecipe({ prepTimeMinutes: 10, cookTimeMinutes: 20 })

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(recipe)

      expect(result.timeText.value).toBe('30分钟')
    })

    it('should format time equal to 60 minutes (1 hour)', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const recipe = createMockRecipe({ prepTimeMinutes: 30, cookTimeMinutes: 30 })

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(recipe)

      expect(result.timeText.value).toBe('1小时')
    })

    it('should format time greater than 60 minutes with remainder', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const recipe = createMockRecipe({ prepTimeMinutes: 45, cookTimeMinutes: 45 })

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(recipe)

      expect(result.timeText.value).toBe('1小时30分钟')
    })

    it('should format time greater than 60 minutes without remainder', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const recipe = createMockRecipe({ prepTimeMinutes: 60, cookTimeMinutes: 60 })

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(recipe)

      expect(result.timeText.value).toBe('2小时')
    })
  })

  describe('placeholderGradient', () => {
    it('should return valid CSS gradient string', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(createMockRecipe())

      expect(result.placeholderGradient.value).toMatch(/^linear-gradient\(135deg, #\w+ 0%, #\w+ 100%\)$/)
    })
  })

  describe('patternSvg', () => {
    it('should return valid SVG data URL', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(createMockRecipe())

      expect(result.patternSvg.value).toMatch(/^url\("data:image\/svg\+xml,.*"\)$/)
    })
  })

  describe('POSTER_WIDTH and POSTER_HEIGHT', () => {
    it('should have correct poster dimensions', async () => {
      vi.mock('#imports', () => ({
        useI18n: vi.fn(() => ({
          t: (key: string) => key,
          locale: ref('en'),
        })),
      }))

      const { useSharePosterLogic } = await import('../app/composables/useSharePosterLogic')
      const result = useSharePosterLogic(createMockRecipe())

      expect(result.POSTER_WIDTH).toBe(1080)
      expect(result.POSTER_HEIGHT).toBe(1350)
    })
  })
})