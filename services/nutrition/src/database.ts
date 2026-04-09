/**
 * Nutrition Database - Common ingredients with nutritional values per 100g
 * Based on USDA FoodData Central and general nutritional data
 */

export interface NutritionData {
  calories: number; // kcal per 100g
  protein: number;   // grams per 100g
  carbs: number;     // grams per 100g
  fat: number;       // grams per 100g
  fiber: number;     // grams per 100g
}

export interface IngredientNutrition extends NutritionData {
  name: string;
  aliases?: string[];
  defaultUnit?: string;
  gramsPerUnit?: number;
}

export const UNIT_TO_GRAMS: Record<string, number> = {
  cup: 240, cups: 240,
  tbsp: 15, tablespoon: 15, tablespoons: 15,
  tsp: 5, teaspoon: 5, teaspoons: 5,
  ml: 1, milliliter: 1, milliliters: 1,
  l: 1000, liter: 1000, liters: 1000,
  g: 1, gram: 1, grams: 1,
  kg: 1000, kilogram: 1000, kilograms: 1000,
  oz: 28.35, ounce: 28.35, ounces: 28.35,
  lb: 453.6, pound: 453.6, pounds: 453.6,
  piece: 100, pieces: 100,
  slice: 30, slices: 30,
  clove: 5, cloves: 5,
  head: 300, heads: 300,
  stalk: 40, stalks: 40,
  sprig: 5, sprigs: 5,
  whole: 100, large: 100, medium: 80, small: 50,
};

export const NUTRITION_DATABASE: Record<string, IngredientNutrition> = {
  chicken: { name: "Chicken", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, defaultUnit: "g" },
  beef: { name: "Beef", calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, defaultUnit: "g" },
  pork: { name: "Pork", calories: 242, protein: 27, carbs: 0, fat: 14, fiber: 0, defaultUnit: "g" },
  salmon: { name: "Salmon", calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, defaultUnit: "g" },
  tuna: { name: "Tuna", calories: 132, protein: 28, carbs: 0, fat: 1, fiber: 0, defaultUnit: "g" },
  shrimp: { name: "Shrimp", calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, defaultUnit: "g" },
  tofu: { name: "Tofu", calories: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3, defaultUnit: "g" },
  egg: { name: "Egg", calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, defaultUnit: "piece", gramsPerUnit: 50 },
  eggs: { name: "Eggs", calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, defaultUnit: "piece", gramsPerUnit: 50 },
  milk: { name: "Milk", calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, defaultUnit: "ml" },
  cheese: { name: "Cheese", calories: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0, defaultUnit: "g" },
  butter: { name: "Butter", calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, defaultUnit: "g" },
  cream: { name: "Cream", calories: 340, protein: 2.1, carbs: 2.8, fat: 36, fiber: 0, defaultUnit: "ml" },
  yogurt: { name: "Yogurt", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, defaultUnit: "g" },
  rice: { name: "Rice", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, defaultUnit: "g" },
  pasta: { name: "Pasta", calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, defaultUnit: "g" },
  bread: { name: "Bread", calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, defaultUnit: "slice", gramsPerUnit: 30 },
  flour: { name: "Flour", calories: 364, protein: 10, carbs: 76, fat: 1, fiber: 2.7, defaultUnit: "g" },
  potato: { name: "Potato", calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, defaultUnit: "g" },
  broccoli: { name: "Broccoli", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, defaultUnit: "g" },
  spinach: { name: "Spinach", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, defaultUnit: "g" },
  carrot: { name: "Carrot", calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, defaultUnit: "g" },
  onion: { name: "Onion", calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, defaultUnit: "g" },
  garlic: { name: "Garlic", calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, defaultUnit: "clove", gramsPerUnit: 5 },
  tomato: { name: "Tomato", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, defaultUnit: "g" },
  "olive oil": { name: "Olive Oil", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, defaultUnit: "ml" },
  sugar: { name: "Sugar", calories: 387, protein: 0, carbs: 100, fat: 0, fiber: 0, defaultUnit: "g" },
  "soy sauce": { name: "Soy Sauce", calories: 53, protein: 8, carbs: 5, fat: 0.1, fiber: 0.8, defaultUnit: "ml" },
};

export function lookupIngredient(name: string): IngredientNutrition | null {
  const normalized = name.toLowerCase().trim();
  if (NUTRITION_DATABASE[normalized]) {
    return NUTRITION_DATABASE[normalized];
  }
  for (const [key, data] of Object.entries(NUTRITION_DATABASE)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return data;
    }
  }
  return null;
}
