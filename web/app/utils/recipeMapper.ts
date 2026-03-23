import type { Recipe, Locale } from '~/types'

/**
 * Shared helper to map raw DB recipe data to Recipe type
 * Used by useRecipes and useFavorites composables
 */
export function mapRecipeData(data: any, loc: Locale): Recipe {
  const translation = data.recipe_translations?.find(
    (t: any) => t.locale === loc
  ) || data.recipe_translations?.[0]

  return {
    ...data,
    title: translation?.title || data.category,
    description: translation?.description,
    translations: data.recipe_translations,
    ingredients: (data.ingredients || []).map((ing: any) => {
      const ingTranslation = ing.ingredient_translations?.find(
        (t: any) => t.locale === loc
      )
      return {
        id: ing.id,
        name: ingTranslation?.name || ing.name,
        amount: ing.amount,
        unit: ing.unit,
        translations: ing.ingredient_translations,
      }
    }),
    steps: (data.steps || [])
      .sort((a: any, b: any) => a.step_number - b.step_number)
      .map((step: any) => {
        const stepTranslation = step.step_translations?.find(
          (t: any) => t.locale === loc
        )
        return {
          id: step.id,
          stepNumber: step.step_number,
          instruction: stepTranslation?.instruction || step.instruction,
          durationMinutes: step.duration_minutes,
          translations: step.step_translations,
        }
      }),
    tags: data.tags?.map((t: any) => t.tag) || [],
    prepTimeMinutes: data.prep_time_minutes,
    cookTimeMinutes: data.cook_time_minutes,
    nutritionInfo: data.nutrition_info,
    imageUrl: data.image_url,
    views: data.views || 0,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}
