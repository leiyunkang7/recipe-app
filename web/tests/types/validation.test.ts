import { describe, it, expect } from 'vitest'
import type {
  Recipe,
  Ingredient,
  RecipeStep,
  RecipeFilters,
  CreateRecipeDTO,
  Category,
  Cuisine,
} from '~/app/types'

describe('types/validation', () => {
  describe('Recipe type validation', () => {
    it('should create a valid recipe with required fields', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Test Recipe',
        category: 'main',
        servings: 4,
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        difficulty: 'medium',
        ingredients: [],
        steps: [],
      }

      expect(recipe.id).toBe('1')
      expect(recipe.title).toBe('Test Recipe')
      expect(recipe.difficulty).toBe('medium')
    })

    it('should accept all difficulty levels', () => {
      const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']
      
      difficulties.forEach((difficulty) => {
        const recipe: Recipe = {
          id: '1',
          title: 'Test',
          category: 'main',
          servings: 1,
          prepTimeMinutes: 1,
          cookTimeMinutes: 1,
          difficulty,
          ingredients: [],
          steps: [],
        }
        expect(recipe.difficulty).toBe(difficulty)
      })
    })

    it('should support optional fields', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Test Recipe',
        category: 'dessert',
        cuisine: 'Italian',
        servings: 2,
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        difficulty: 'easy',
        ingredients: [],
        steps: [],
        tags: ['quick', 'healthy'],
        nutritionInfo: {
          calories: 200,
          protein: 10,
          carbs: 25,
          fat: 8,
        },
        imageUrl: 'https://example.com/image.jpg',
        source: 'https://example.com',
      }

      expect(recipe.cuisine).toBe('Italian')
      expect(recipe.tags).toEqual(['quick', 'healthy'])
      expect(recipe.nutritionInfo?.calories).toBe(200)
      expect(recipe.imageUrl).toContain('example.com')
    })

    it('should support translations', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Test Recipe',
        category: 'main',
        servings: 1,
        prepTimeMinutes: 1,
        cookTimeMinutes: 1,
        difficulty: 'easy',
        ingredients: [],
        steps: [],
        translations: [
          { locale: 'en', title: 'English Title', description: 'English desc' },
          { locale: 'zh-CN', title: '中文标题', description: '中文描述' },
        ],
      }

      expect(recipe.translations).toHaveLength(2)
      expect(recipe.translations?.[0].locale).toBe('en')
      expect(recipe.translations?.[1].locale).toBe('zh-CN')
    })
  })

  describe('Ingredient validation', () => {
    it('should create a valid ingredient', () => {
      const ingredient: Ingredient = {
        id: '1',
        name: 'Flour',
        amount: 200,
        unit: 'g',
      }

      expect(ingredient.name).toBe('Flour')
      expect(ingredient.amount).toBe(200)
      expect(ingredient.unit).toBe('g')
    })

    it('should support ingredient translations', () => {
      const ingredient: Ingredient = {
        name: 'Sugar',
        amount: 100,
        unit: 'g',
        translations: [
          { locale: 'en', name: 'Sugar' },
          { locale: 'zh-CN', name: '糖' },
        ],
      }

      expect(ingredient.translations).toHaveLength(2)
      expect(ingredient.translations?.[1].name).toBe('糖')
    })
  })

  describe('RecipeStep validation', () => {
    it('should create a valid recipe step', () => {
      const step: RecipeStep = {
        id: '1',
        stepNumber: 1,
        instruction: 'Mix the ingredients',
        durationMinutes: 5,
      }

      expect(step.stepNumber).toBe(1)
      expect(step.instruction).toBe('Mix the ingredients')
      expect(step.durationMinutes).toBe(5)
    })

    it('should support step translations', () => {
      const step: RecipeStep = {
        stepNumber: 1,
        instruction: 'Preheat oven',
        translations: [
          { locale: 'en', instruction: 'Preheat oven' },
          { locale: 'zh-CN', instruction: '预热烤箱' },
        ],
      }

      expect(step.translations).toHaveLength(2)
      expect(step.translations?.[1].instruction).toBe('预热烤箱')
    })
  })

  describe('RecipeFilters validation', () => {
    it('should create filters with all optional fields', () => {
      const filters: RecipeFilters = {
        category: 'main',
        cuisine: 'Italian',
        difficulty: 'medium',
        search: 'pasta',
        locale: 'en',
      }

      expect(filters.category).toBe('main')
      expect(filters.cuisine).toBe('Italian')
      expect(filters.difficulty).toBe('medium')
      expect(filters.search).toBe('pasta')
      expect(filters.locale).toBe('en')
    })

    it('should allow empty filter', () => {
      const filters: RecipeFilters = {}
      expect(filters.category).toBeUndefined()
      expect(filters.cuisine).toBeUndefined()
    })
  })

  describe('CreateRecipeDTO validation', () => {
    it('should require all mandatory fields', () => {
      const dto: CreateRecipeDTO = {
        title: 'New Recipe',
        category: 'main',
        servings: 4,
        prepTimeMinutes: 10,
        cookTimeMinutes: 30,
        difficulty: 'hard',
        ingredients: [
          { name: 'Eggs', amount: 2, unit: 'pcs' },
        ],
        steps: [
          { stepNumber: 1, instruction: 'Crack eggs' },
        ],
      }

      expect(dto.title).toBe('New Recipe')
      expect(dto.ingredients).toHaveLength(1)
      expect(dto.steps).toHaveLength(1)
    })
  })

  describe('Category and Cuisine types', () => {
    it('should create a valid category', () => {
      const category: Category = {
        id: 1,
        name: 'Dessert',
        translations: [
          { locale: 'en', name: 'Dessert' },
          { locale: 'zh-CN', name: '甜点' },
        ],
      }

      expect(category.id).toBe(1)
      expect(category.name).toBe('Dessert')
      expect(category.translations).toHaveLength(2)
    })

    it('should create a valid cuisine', () => {
      const cuisine: Cuisine = {
        id: 1,
        name: 'Italian',
        translations: [
          { locale: 'en', name: 'Italian' },
          { locale: 'zh-CN', name: '意大利' },
        ],
      }

      expect(cuisine.id).toBe(1)
      expect(cuisine.name).toBe('Italian')
      expect(cuisine.translations).toHaveLength(2)
    })
  })

  describe('NutritionInfo validation', () => {
    it('should support partial nutrition info', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Test',
        category: 'main',
        servings: 1,
        prepTimeMinutes: 1,
        cookTimeMinutes: 1,
        difficulty: 'easy',
        ingredients: [],
        steps: [],
        nutritionInfo: {
          calories: 150,
          protein: 20,
        },
      }

      expect(recipe.nutritionInfo?.calories).toBe(150)
      expect(recipe.nutritionInfo?.carbs).toBeUndefined()
      expect(recipe.nutritionInfo?.fat).toBeUndefined()
    })
  })
})
