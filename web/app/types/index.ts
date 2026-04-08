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
  imageUrl?: string
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
  /** Temperature in Celsius for this step (e.g., oven temperature) */
  temperature?: number
  imageUrl?: string
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
  authorId?: string
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
  cookingCount?: number
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
  /** Recipe description for search highlighting */
  description?: string
  imageUrl?: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  views?: number
  cookingCount?: number
  created_at?: string
  /** Average rating 1-5, 0 if no ratings */
  averageRating?: number
  /** Number of ratings */
  ratingCount?: number
  /** Nutrition information for the recipe */
  nutritionInfo?: NutritionInfo
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export type TasteTag = 'spicy' | 'sweet' | 'savory' | 'sour' | 'umami' | 'mild' | 'rich' | 'light'

export type SortOption = 'newest' | 'popular' | 'rating' | 'quickest'

export interface NutritionRange {
  minCalories?: number
  maxCalories?: number
  minProtein?: number
  maxProtein?: number
  minCarbs?: number
  maxCarbs?: number
  minFat?: number
  maxFat?: number
}

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
  authorId?: string
  /** Sort order */
  sortBy?: SortOption
  /** Filter by minimum average rating (1-5) */
  minRating?: number
  /** Nutrition range filters */
  nutrition?: NutritionRange
}

export interface CreateRecipeDTO {
  authorId?: string
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

// ============ Breadcrumb Types (TypeScript Discriminated Union Pattern) ============

export type BreadcrumbLinkItem = {
  type: 'link'
  label: string
  href: string
}

export type BreadcrumbEllipsisItem = {
  type: 'ellipsis'
  label: string
}

export type BreadcrumbCurrentItem = {
  type: 'current'
  label: string
}

export type BreadcrumbItem = BreadcrumbLinkItem | BreadcrumbEllipsisItem | BreadcrumbCurrentItem

export function isBreadcrumbLinkItem(item: BreadcrumbItem): item is BreadcrumbLinkItem {
  return item.type === 'link'
}

export function isBreadcrumbEllipsisItem(item: BreadcrumbItem): item is BreadcrumbEllipsisItem {
  return item.type === 'ellipsis'
}

export function isBreadcrumbCurrentItem(item: BreadcrumbItem): item is BreadcrumbCurrentItem {
  return item.type === 'current'
}

export function createBreadcrumbLink(label: string, href: string): BreadcrumbLinkItem {
  return { type: 'link', label, href }
}

export function createBreadcrumbEllipsis(label: string = '...'): BreadcrumbEllipsisItem {
  return { type: 'ellipsis', label }
}

export function createBreadcrumbCurrent(label: string): BreadcrumbCurrentItem {
  return { type: 'current', label }
}

// ============ Review Types ============

export interface ReviewUser {
  id: string
  name: string | null
  avatarUrl: string | null
}

export interface Review {
  id: string
  recipeId: string
  content: string
  createdAt: string
  updatedAt: string
  user: ReviewUser
}

export interface ReviewWithPagination {
  reviews: Review[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
