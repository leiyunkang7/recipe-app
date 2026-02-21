export interface Ingredient {
  name: string
  amount: number
  unit: string
}

export interface RecipeStep {
  stepNumber: number
  instruction: string
  durationMinutes?: number
}

export interface NutritionInfo {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
}

export interface Recipe {
  id: string
  title: string
  description?: string
  category: string
  cuisine?: string
  servings: number
  prepTimeMinutes: number
  cookTimeMinutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  ingredients: Ingredient[]
  steps: RecipeStep[]
  tags?: string[]
  nutritionInfo?: NutritionInfo
  imageUrl?: string
  source?: string
  created_at?: string
  updated_at?: string
}

export interface RecipeFilters {
  category?: string
  cuisine?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  search?: string
}

export interface CreateRecipeDTO {
  title: string
  description?: string
  category: string
  cuisine?: string
  servings: number
  prepTimeMinutes: number
  cookTimeMinutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  ingredients: Ingredient[]
  steps: RecipeStep[]
  tags?: string[]
  nutritionInfo?: NutritionInfo
  imageUrl?: string
  source?: string
}
