import { describe, it, expect } from 'vitest'
import type { 
  Recipe, 
  Ingredient, 
  RecipeStep, 
  RecipeFilters, 
  CreateRecipeDTO,
  Category,
  Cuisine,
  NutritionInfo,
  Locale
} from '../app/types'

describe('Recipe Types', () => {
  describe('Recipe type validation', () => {
    it('should create a valid Recipe object', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Test Recipe',
        description: 'A delicious test recipe',
        category: 'main',
        cuisine: 'Italian',
        servings: 4,
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        difficulty: 'medium',
        ingredients: [],
        steps: [],
        tags: ['quick', 'easy'],
        nutritionInfo: {
          calories: 500,
          protein: 20,
          carbs: 50,
          fat: 15,
          fiber: 5
        }
      }

      expect(recipe.id).toBe('1')
      expect(recipe.title).toBe('Test Recipe')
      expect(recipe.difficulty).toBe('medium')
      expect(recipe.servings).toBe(4)
    })

    it('should allow optional fields to be undefined', () => {
      const recipe: Recipe = {
        id: '1',
        title: 'Minimal Recipe',
        category: 'main',
        servings: 2,
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        difficulty: 'easy',
        ingredients: [],
        steps: []
      }

      expect(recipe.description).toBeUndefined()
      expect(recipe.cuisine).toBeUndefined()
      expect(recipe.tags).toBeUndefined()
      expect(recipe.nutritionInfo).toBeUndefined()
    })

    it('should validate difficulty values', () => {
      const easyRecipe: Recipe = {
        id: '1',
        title: 'Easy Recipe',
        category: 'dessert',
        servings: 1,
        prepTimeMinutes: 5,
        cookTimeMinutes: 5,
        difficulty: 'easy',
        ingredients: [],
        steps: []
      }

      const hardRecipe: Recipe = {
        id: '2',
        title: 'Hard Recipe',
        category: 'main',
        servings: 6,
        prepTimeMinutes: 60,
        cookTimeMinutes: 120,
        difficulty: 'hard',
        ingredients: [],
        steps: []
      }

      expect(easyRecipe.difficulty).toBe('easy')
      expect(hardRecipe.difficulty).toBe('hard')
    })
  })

  describe('Ingredient type', () => {
    it('should create a valid Ingredient', () => {
      const ingredient: Ingredient = {
        id: 'ing-1',
        name: 'Flour',
        amount: 200,
        unit: 'g',
        translations: [
          { locale: 'en', name: 'Flour' },
          { locale: 'zh-CN', name: '面粉' }
        ]
      }

      expect(ingredient.name).toBe('Flour')
      expect(ingredient.amount).toBe(200)
      expect(ingredient.unit).toBe('g')
      expect(ingredient.translations).toHaveLength(2)
    })

    it('should allow ingredient without optional id', () => {
      const ingredient: Ingredient = {
        name: 'Salt',
        amount: 1,
        unit: 'tsp'
      }

      expect(ingredient.id).toBeUndefined()
      expect(ingredient.name).toBe('Salt')
    })
  })

  describe('RecipeStep type', () => {
    it('should create a valid RecipeStep', () => {
      const step: RecipeStep = {
        id: 'step-1',
        stepNumber: 1,
        instruction: 'Preheat oven to 180°C',
        durationMinutes: 10,
        translations: [
          { locale: 'en', instruction: 'Preheat oven to 180°C' },
          { locale: 'zh-CN', instruction: '预热烤箱至180°C' }
        ]
      }

      expect(step.stepNumber).toBe(1)
      expect(step.instruction).toBe('Preheat oven to 180°C')
      expect(step.durationMinutes).toBe(10)
    })

    it('should allow step without optional fields', () => {
      const step: RecipeStep = {
        stepNumber: 1,
        instruction: 'Mix ingredients'
      }

      expect(step.id).toBeUndefined()
      expect(step.durationMinutes).toBeUndefined()
      expect(step.translations).toBeUndefined()
    })
  })

  describe('NutritionInfo type', () => {
    it('should create NutritionInfo with all fields', () => {
      const nutrition: NutritionInfo = {
        calories: 450,
        protein: 25,
        carbs: 40,
        fat: 20,
        fiber: 8
      }

      expect(nutrition.calories).toBe(450)
      expect(nutrition.protein).toBe(25)
      expect(nutrition.carbs).toBe(40)
      expect(nutrition.fat).toBe(20)
      expect(nutrition.fiber).toBe(8)
    })

    it('should allow partial NutritionInfo', () => {
      const nutrition: NutritionInfo = {
        calories: 200,
        protein: 10
      }

      expect(nutrition.calories).toBe(200)
      expect(nutrition.protein).toBe(10)
      expect(nutrition.carbs).toBeUndefined()
      expect(nutrition.fat).toBeUndefined()
    })
  })

  describe('RecipeFilters type', () => {
    it('should create valid filter combinations', () => {
      const filters: RecipeFilters = {
        category: 'main',
        cuisine: 'Italian',
        difficulty: 'medium',
        search: 'pasta',
        locale: 'en'
      }

      expect(filters.category).toBe('main')
      expect(filters.cuisine).toBe('Italian')
      expect(filters.difficulty).toBe('medium')
      expect(filters.search).toBe('pasta')
      expect(filters.locale).toBe('en')
    })

    it('should allow empty filters', () => {
      const filters: RecipeFilters = {}

      expect(filters.category).toBeUndefined()
      expect(filters.cuisine).toBeUndefined()
      expect(filters.difficulty).toBeUndefined()
    })
  })

  describe('CreateRecipeDTO type', () => {
    it('should create a valid CreateRecipeDTO', () => {
      const dto: CreateRecipeDTO = {
        title: 'New Recipe',
        description: 'A newly created recipe',
        category: 'dessert',
        cuisine: 'French',
        servings: 4,
        prepTimeMinutes: 20,
        cookTimeMinutes: 40,
        difficulty: 'medium',
        ingredients: [
          { name: 'Sugar', amount: 100, unit: 'g' },
          { name: 'Butter', amount: 50, unit: 'g' }
        ],
        steps: [
          { stepNumber: 1, instruction: 'Mix ingredients' }
        ],
        tags: ['sweet', 'baking'],
        nutritionInfo: { calories: 300 },
        imageUrl: 'https://example.com/image.jpg',
        source: 'Original',
        translations: [
          { locale: 'zh-CN', title: '新食谱', description: '新创建的食谱' }
        ]
      }

      expect(dto.title).toBe('New Recipe')
      expect(dto.ingredients).toHaveLength(2)
      expect(dto.steps).toHaveLength(1)
      expect(dto.translations).toHaveLength(1)
    })
  })

  describe('Category and Cuisine types', () => {
    it('should create a valid Category', () => {
      const category: Category = {
        id: 1,
        name: 'Main Course',
        translations: [
          { locale: 'en', name: 'Main Course' },
          { locale: 'zh-CN', name: '主菜' }
        ]
      }

      expect(category.id).toBe(1)
      expect(category.name).toBe('Main Course')
      expect(category.translations).toHaveLength(2)
    })

    it('should create a valid Cuisine', () => {
      const cuisine: Cuisine = {
        id: 2,
        name: 'Italian',
        translations: [
          { locale: 'en', name: 'Italian' },
          { locale: 'zh-CN', name: '意大利' }
        ]
      }

      expect(cuisine.id).toBe(2)
      expect(cuisine.name).toBe('Italian')
    })
  })

  describe('Locale type', () => {
    it('should support en locale', () => {
      const locale: Locale = 'en'
      expect(locale).toBe('en')
    })

    it('should support zh-CN locale', () => {
      const locale: Locale = 'zh-CN'
      expect(locale).toBe('zh-CN')
    })
  })
})

describe('Recipe Business Logic', () => {
  describe('totalTime calculation', () => {
    it('should calculate total time correctly', () => {
      const recipe = {
        id: '1',
        title: 'Test',
        category: 'main',
        servings: 4,
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        difficulty: 'medium' as const,
        ingredients: [],
        steps: []
      }

      const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes
      expect(totalTime).toBe(45)
    })
  })

  describe('recipe completeness', () => {
    it('should identify recipe with missing ingredients', () => {
      const recipe = {
        id: '1',
        title: 'Incomplete Recipe',
        category: 'main',
        servings: 4,
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        difficulty: 'easy' as const,
        ingredients: [],
        steps: []
      }

      const hasIngredients = recipe.ingredients.length > 0
      expect(hasIngredients).toBe(false)
    })

    it('should identify recipe with missing steps', () => {
      const recipe = {
        id: '1',
        title: 'Recipe Without Steps',
        category: 'main',
        servings: 2,
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        difficulty: 'easy' as const,
        ingredients: [{ name: 'Salt', amount: 1, unit: 'pinch' }],
        steps: []
      }

      const hasSteps = recipe.steps.length > 0
      expect(hasSteps).toBe(false)
    })
  })

  describe('servings scaling', () => {
    it('should scale ingredient amounts correctly', () => {
      const recipe = {
        id: '1',
        title: 'Scalable Recipe',
        category: 'main',
        servings: 4,
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        difficulty: 'easy' as const,
        ingredients: [
          { name: 'Flour', amount: 200, unit: 'g' },
          { name: 'Sugar', amount: 100, unit: 'g' }
        ],
        steps: []
      }

      const targetServings = 8
      const scaleFactor = targetServings / recipe.servings

      const scaledIngredients = recipe.ingredients.map(ing => ({
        ...ing,
        amount: ing.amount * scaleFactor
      }))

      expect(scaledIngredients[0].amount).toBe(400)
      expect(scaledIngredients[1].amount).toBe(200)
    })
  })
})
