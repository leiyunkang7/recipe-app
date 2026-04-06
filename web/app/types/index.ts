export type Locale = 'en' | 'zh-CN'

// Re-export component prop types
export * from './component-props'

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

/**
 * Lightweight recipe type for list views (virtual scrolling)
 * Only includes fields actually displayed in RecipeCardLazy
 */
export interface RecipeListItem {
  id: string
  title: string
  imageUrl?: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  views?: number
  created_at?: string
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export type TasteTag = 'spicy' | 'sweet' | 'savory' | 'sour' | 'umami' | 'mild' | 'rich' | 'light'

export interface RecipeFilters {
  category?: string
  cuisine?: string
  difficulty?: DifficultyLevel
  search?: string
  locale?: Locale
  /** Filter by ingredient names */
  ingredients?: string[]
  /** Filter by maximum total time (prepTime + cookTime) in minutes */
  maxTime?: number
  /** Filter by taste/tags */
  taste?: TasteTag[]
  /** Filter by minimum total time in minutes */
  minTime?: number
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
