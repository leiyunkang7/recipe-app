/**
 * useNutritionCalculator - 营养成分计算 Composable
 * 
 * 功能：
 * - 基于食材计算营养成分
 * - 单位转换 (cups, tbsp, tsp, g, kg, oz, lb, ml, L)
 * - 支持按份数计算
 */

import type { Ingredient } from '~/types'

// 食材营养成分数据库 (每100g的营养成分)
const INGREDIENT_NUTRITION_DB: Record<string, {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  density?: number
}> = {
  flour: { calories: 364, protein: 10, carbs: 76, fat: 1, fiber: 2.7, density: 125 },
  'all-purpose flour': { calories: 364, protein: 10, carbs: 76, fat: 1, fiber: 2.7, density: 125 },
  rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, density: 185 },
  chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  egg: { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, density: 50 },
  eggs: { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, density: 50 },
  milk: { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, density: 245 },
  butter: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, density: 227 },
  sugar: { calories: 387, protein: 0, carbs: 100, fat: 0, fiber: 0, density: 200 },
  oil: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, density: 218 },
  'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, density: 218 },
  onion: { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, density: 160 },
  tomato: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, density: 180 },
  potato: { calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, density: 150 },
  garlic: { calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, density: 136 },
  carrot: { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, density: 128 },
  salt: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, density: 273 },
  'soy sauce': { calories: 53, protein: 8, carbs: 5, fat: 0.1, fiber: 0.8, density: 255 },
}

const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1, gram: 1, grams: 1,
  kg: 1000, kilogram: 1000, kilograms: 1000,
  oz: 28.35, ounce: 28.35, ounces: 28.35,
  lb: 453.6, lbs: 453.6, pound: 453.6, pounds: 453.6,
  ml: 1, milliliter: 1, milliliters: 1,
  l: 1000, L: 1000, liter: 1000, liters: 1000,
  tsp: 5, teaspoon: 5, teaspoons: 5,
  tbsp: 15, tablespoon: 15, tablespoons: 15,
  cup: 240, cups: 240, c: 240,
  piece: 100, pieces: 100,
  slice: 30, slices: 30,
  clove: 5, cloves: 5,
}

interface NutritionResult {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export function useNutritionCalculator() {
  const findIngredientNutrition = (name: string) => {
    const normalizedName = name.toLowerCase().trim()
    if (INGREDIENT_NUTRITION_DB[normalizedName]) {
      return INGREDIENT_NUTRITION_DB[normalizedName]
    }
    for (const key of Object.keys(INGREDIENT_NUTRITION_DB)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return INGREDIENT_NUTRITION_DB[key]
      }
    }
    const singularName = normalizedName.replace(/s$/, '')
    if (INGREDIENT_NUTRITION_DB[singularName]) {
      return INGREDIENT_NUTRITION_DB[singularName]
    }
    return null
  }

  const convertToGrams = (amount: number, unit: string): number => {
    const normalizedUnit = unit.toLowerCase().trim()
    const conversionFactor = UNIT_TO_GRAMS[normalizedUnit]
    if (conversionFactor) {
      return amount * conversionFactor
    }
    return amount
  }

  const calculateIngredientNutrition = (ingredient: Ingredient): NutritionResult => {
    const nutrition = findIngredientNutrition(ingredient.name)
    if (!nutrition) {
      const grams = convertToGrams(ingredient.amount, ingredient.unit)
      const factor = grams / 100
      return {
        calories: 50 * factor,
        protein: 2 * factor,
        carbs: 5 * factor,
        fat: 1 * factor,
        fiber: 1 * factor,
      }
    }
    let grams: number
    if (nutrition.density && ['cup', 'cups', 'c', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons'].includes(ingredient.unit.toLowerCase())) {
      const unitInGrams = convertToGrams(1, ingredient.unit)
      grams = (ingredient.amount * unitInGrams * nutrition.density) / 240
    } else {
      grams = convertToGrams(ingredient.amount, ingredient.unit)
    }
    const factor = grams / 100
    return {
      calories: (nutrition.calories || 0) * factor,
      protein: (nutrition.protein || 0) * factor,
      carbs: (nutrition.carbs || 0) * factor,
      fat: (nutrition.fat || 0) * factor,
      fiber: (nutrition.fiber || 0) * factor,
    }
  }

  const calculateRecipeNutrition = (ingredients: Ingredient[]): NutritionResult => {
    return ingredients.reduce((total, ingredient) => {
      const ingredientNutrition = calculateIngredientNutrition(ingredient)
      return {
        calories: total.calories + ingredientNutrition.calories,
        protein: total.protein + ingredientNutrition.protein,
        carbs: total.carbs + ingredientNutrition.carbs,
        fat: total.fat + ingredientNutrition.fat,
        fiber: total.fiber + ingredientNutrition.fiber,
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
  }

  const calculatePerServingNutrition = (ingredients: Ingredient[], servings: number): NutritionResult => {
    const total = calculateRecipeNutrition(ingredients)
    const perServing = servings > 0 ? servings : 1
    return {
      calories: Math.round(total.calories / perServing),
      protein: Math.round(total.protein / perServing * 10) / 10,
      carbs: Math.round(total.carbs / perServing * 10) / 10,
      fat: Math.round(total.fat / perServing * 10) / 10,
      fiber: Math.round(total.fiber / perServing * 10) / 10,
    }
  }

  const getKnownIngredientsSummary = (ingredients: Ingredient[]) => {
    const known: string[] = []
    const unknown: string[] = []
    for (const ingredient of ingredients) {
      if (findIngredientNutrition(ingredient.name)) {
        known.push(ingredient.name)
      } else {
        unknown.push(ingredient.name)
      }
    }
    return { known, unknown }
  }

  return {
    findIngredientNutrition,
    convertToGrams,
    calculateIngredientNutrition,
    calculateRecipeNutrition,
    calculatePerServingNutrition,
    getKnownIngredientsSummary,
    INGREDIENT_NUTRITION_DB,
  }
}
