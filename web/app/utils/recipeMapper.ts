import type { Recipe, Locale, IngredientTranslation, StepTranslation, Translation, RecipeListItem } from '~/types'

/**
 * Raw database types (snake_case from Supabase)
 */
export interface RawRecipeTranslation {
  locale: Locale
  title: string
  description?: string
}

interface RawIngredient {
  id: string
  name: string
  amount: number
  unit: string
  ingredient_translations?: Array<{ locale: Locale; name: string }>
}

interface RawStep {
  id: string
  step_number: number
  instruction: string
  duration_minutes?: number
  step_translations?: Array<{ locale: Locale; instruction: string }>
}

interface RawTag {
  tag: string
}

export interface RawRecipe {
  id: string
  author_id?: string
  category: string
  recipe_translations?: RawRecipeTranslation[]
  ingredients?: RawIngredient[]
  steps?: RawStep[]
  tags?: RawTag[]
  prep_time_minutes: number
  cook_time_minutes: number
  nutrition_info?: Record<string, number>
  image_url?: string
  views?: number
  cooking_count?: number
  created_at?: string
  updated_at?: string
}

/**
 * Lightweight raw recipe for list view (only fields needed for RecipeCardLazy)
 */
export interface RawRecipeListItem {
  id: string
  author_id?: string
  recipe_translations?: RawRecipeTranslation[]
  prep_time_minutes: number
  cook_time_minutes: number
  image_url?: string
  views?: number
  created_at?: string
  average_rating?: number
  rating_count?: number
  nutrition_info?: Record<string, number>
}

/**
 * Shared helper to map raw DB recipe data to Recipe type
 * Used by useRecipes and useFavorites composables
 */
export function mapRecipeData(data: RawRecipe, loc: Locale): Recipe {
  const translation = data.recipe_translations?.find(
    (t) => t.locale === loc
  ) || data.recipe_translations?.[0]

  return {
    id: data.id,
    authorId: data.author_id,
    title: translation?.title || data.category,
    description: translation?.description,
    category: data.category,
    cuisine: undefined,
    servings: 4,
    difficulty: 'medium',
    translations: data.recipe_translations as Translation[] | undefined,
    ingredients: (data.ingredients || []).map((ing): import('~/types').Ingredient => {
      const ingTranslation = ing.ingredient_translations?.find(
        (t) => t.locale === loc
      )
      return {
        id: ing.id,
        name: ingTranslation?.name || ing.name,
        amount: ing.amount,
        unit: ing.unit,
        translations: ing.ingredient_translations as IngredientTranslation[] | undefined,
      }
    }),
    steps: (data.steps || [])
      .sort((a, b) => a.step_number - b.step_number)
      .map((step): import('~/types').RecipeStep => {
        const stepTranslation = step.step_translations?.find(
          (t) => t.locale === loc
        )
        return {
          id: step.id,
          stepNumber: step.step_number,
          instruction: stepTranslation?.instruction || step.instruction,
          durationMinutes: step.duration_minutes,
          translations: step.step_translations as StepTranslation[] | undefined,
        }
      }),
    tags: data.tags?.map((t) => t.tag) || [],
    prepTimeMinutes: data.prep_time_minutes,
    cookTimeMinutes: data.cook_time_minutes,
    nutritionInfo: data.nutrition_info,
    imageUrl: data.image_url,
    views: data.views || 0,
    cookingCount: data.cooking_count || 0,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

/**
 * Map raw list item to RecipeListItem (no ingredients/steps fetched)
 */
export function mapRecipeListItem(data: RawRecipeListItem, loc: Locale): RecipeListItem {
  const translation = data.recipe_translations?.find(
    (t) => t.locale === loc
  ) || data.recipe_translations?.[0]

  return {
    id: data.id,
    title: translation?.title || 'Untitled Recipe',
    prepTimeMinutes: data.prep_time_minutes,
    cookTimeMinutes: data.cook_time_minutes,
    imageUrl: data.image_url,
    views: data.views || 0,
    cookingCount: data.cooking_count || 0,
    created_at: data.created_at,
    servings: 4, // Default, not fetched in list view
    averageRating: data.average_rating || 0,
    ratingCount: data.rating_count || 0,
    nutritionInfo: data.nutrition_info,
  }
}
