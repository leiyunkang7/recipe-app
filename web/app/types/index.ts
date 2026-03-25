export type Locale = 'en' | 'zh-CN'

export interface Translation {
  locale: Locale
  title: string
  description?: string
}

export interface IngredientTranslation {
  locale: Locale
  name: string
}

export interface StepTranslation {
  locale: Locale
  instruction: string
}

export interface Ingredient {
  id?: string
  name: string
  amount: number
  unit: string
  translations?: IngredientTranslation[]
}

export interface RecipeStep {
  id?: string
  stepNumber: number
  instruction: string
  durationMinutes?: number
  translations?: StepTranslation[]
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
  views?: number
  created_at?: string
  updated_at?: string
  translations?: Translation[]
}

export interface RecipeFilters {
  category?: string
  cuisine?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  search?: string
  locale?: Locale
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
  translations?: Translation[]
}

export interface Category {
  id: number
  name: string
  translations?: { locale: Locale; name: string }[]
}

export interface Cuisine {
  id: number
  name: string
  translations?: { locale: Locale; name: string }[]
}

export interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
  duration: number
}
