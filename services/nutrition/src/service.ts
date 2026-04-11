import { NutritionData, IngredientNutrition, lookupIngredient, UNIT_TO_GRAMS } from "./database";

export { NutritionData, IngredientNutrition, lookupIngredient };

export interface IngredientInput {
  name: string;
  amount: number;
  unit: string;
}

export interface NutritionAnalysisResult {
  total: NutritionData;
  perServing: NutritionData;
  servings: number;
  analyzedIngredients: AnalyzedIngredient[];
  unknownIngredients: string[];
}

export interface AnalyzedIngredient {
  name: string;
  amount: number;
  unit: string;
  grams: number;
  nutrition: NutritionData;
  matchedAs?: string;
}

/**
 * Convert ingredient amount to grams based on unit
 */
function convertToGrams(amount: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().trim();
  
  // Check for direct unit match
  if (UNIT_TO_GRAMS[normalizedUnit]) {
    return amount * UNIT_TO_GRAMS[normalizedUnit];
  }
  
  // Try without 's' suffix for plurals
  const singular = normalizedUnit.endsWith("s") ? normalizedUnit.slice(0, -1) : normalizedUnit;
  if (UNIT_TO_GRAMS[singular]) {
    return amount * UNIT_TO_GRAMS[singular];
  }
  
  // Check if unit is a known ingredient (e.g., "1 onion" where onion has a default weight)
  const ingredientData = lookupIngredient(normalizedUnit);
  if (ingredientData?.gramsPerUnit) {
    return amount * ingredientData.gramsPerUnit;
  }
  
  // Default: assume grams if unit is not recognized
  return amount;
}

/**
 * Calculate nutrition for a single ingredient
 */
function calculateIngredientNutrition(ingredient: IngredientInput): { nutrition: NutritionData; grams: number; matchedAs?: string } | null {
  const nutritionData = lookupIngredient(ingredient.name);
  
  if (!nutritionData) {
    return null;
  }
  
  const grams = convertToGrams(ingredient.amount, ingredient.unit);
  const multiplier = grams / 100; // nutrition data is per 100g
  
  return {
    grams,
    matchedAs: nutritionData.name,
    nutrition: {
      calories: Math.round(nutritionData.calories * multiplier * 10) / 10,
      protein: Math.round(nutritionData.protein * multiplier * 10) / 10,
      carbs: Math.round(nutritionData.carbs * multiplier * 10) / 10,
      fat: Math.round(nutritionData.fat * multiplier * 10) / 10,
      fiber: Math.round(nutritionData.fiber * multiplier * 10) / 10,
    },
  };
}

/**
 * Analyze recipe ingredients and calculate total nutrition
 */
export function analyzeRecipeNutrition(
  ingredients: IngredientInput[],
  servings: number = 1
): NutritionAnalysisResult {
  const analyzedIngredients: AnalyzedIngredient[] = [];
  const unknownIngredients: string[] = [];
  
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  
  for (const ingredient of ingredients) {
    const result = calculateIngredientNutrition(ingredient);
    
    if (result) {
      analyzedIngredients.push({
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit,
        grams: result.grams,
        matchedAs: result.matchedAs,
        nutrition: result.nutrition,
      });
      
      totalCalories += result.nutrition.calories;
      totalProtein += result.nutrition.protein;
      totalCarbs += result.nutrition.carbs;
      totalFat += result.nutrition.fat;
      totalFiber += result.nutrition.fiber;
    } else {
      unknownIngredients.push(ingredient.name);
    }
  }
  
  const total: NutritionData = {
    calories: Math.round(totalCalories * 10) / 10,
    protein: Math.round(totalProtein * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
    fiber: Math.round(totalFiber * 10) / 10,
  };
  
  const perServing: NutritionData = {
    calories: Math.round((totalCalories / servings) * 10) / 10,
    protein: Math.round((totalProtein / servings) * 10) / 10,
    carbs: Math.round((totalCarbs / servings) * 10) / 10,
    fat: Math.round((totalFat / servings) * 10) / 10,
    fiber: Math.round((totalFiber / servings) * 10) / 10,
  };
  
  return {
    total,
    perServing,
    servings,
    analyzedIngredients,
    unknownIngredients,
  };
}

/**
 * Get nutrition label data ready for display
 */
export function formatNutritionForDisplay(nutrition: NutritionData): Record<string, string | number> {
  return {
    "Calories": nutrition.calories.toFixed(0),
    "Protein": `${nutrition.protein.toFixed(1)}g`,
    "Carbohydrates": `${nutrition.carbs.toFixed(1)}g`,
    "Fat": `${nutrition.fat.toFixed(1)}g`,
    "Fiber": `${nutrition.fiber.toFixed(1)}g`,
  };
}

/**
 * Daily value percentages based on FDA 2000 calorie diet standard
 * Reference: https://www.fda.gov/food/food-labeling-nutrition/daily-value-nutrition-and-supplement-facts-labels
 */
export function getDailyValuePercentages(nutrition: NutritionData): Record<string, number> {
  const dailyValues = {
    calories: 2000,
    protein: 50,
    carbs: 275,
    fat: 78,
    fiber: 28,
  };
  
  return {
    calories: Math.round((nutrition.calories / dailyValues.calories) * 100),
    protein: Math.round((nutrition.protein / dailyValues.protein) * 100),
    carbs: Math.round((nutrition.carbs / dailyValues.carbs) * 100),
    fat: Math.round((nutrition.fat / dailyValues.fat) * 100),
    fiber: Math.round((nutrition.fiber / dailyValues.fiber) * 100),
  };
}
