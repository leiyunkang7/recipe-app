import type { Recipe, CreateRecipeDTO, Locale } from '~/types'

export const useRecipeMutations = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const createRecipe = async (recipeData: CreateRecipeDTO): Promise<Recipe | null> => {
    loading.value = true
    error.value = null

    try {
      const body = {
        title: recipeData.title,
        description: recipeData.description,
        category: recipeData.category,
        cuisine: recipeData.cuisine,
        servings: recipeData.servings,
        prep_time_minutes: recipeData.prepTimeMinutes,
        cook_time_minutes: recipeData.cookTimeMinutes,
        difficulty: recipeData.difficulty,
        image_url: recipeData.imageUrl,
        source: recipeData.source,
        nutrition_info: recipeData.nutritionInfo,
        ingredients: recipeData.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        })),
        steps: recipeData.steps.map((step) => ({
          step_number: step.stepNumber,
          instruction: step.instruction,
          duration_minutes: step.durationMinutes,
        })),
        tags: recipeData.tags,
        translations: recipeData.translations?.map((t) => ({
          locale: t.locale,
          title: t.title,
          description: t.description,
        })),
      }

      const { data, error: fetchError } = await useFetch('/api/recipes', {
        method: 'POST',
        body,
      })

      if (fetchError.value) throw fetchError.value
      if (data.value?.error) throw new Error(data.value.error)

      return data.value?.data as Recipe
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create recipe'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateRecipe = async (id: string, recipeData: Partial<CreateRecipeDTO>): Promise<Recipe | null> => {
    loading.value = true
    error.value = null

    try {
      const body: Record<string, any> = {}
      if (recipeData.category !== undefined) body.category = recipeData.category
      if (recipeData.cuisine !== undefined) body.cuisine = recipeData.cuisine
      if (recipeData.servings !== undefined) body.servings = recipeData.servings
      if (recipeData.prepTimeMinutes !== undefined) body.prep_time_minutes = recipeData.prepTimeMinutes
      if (recipeData.cookTimeMinutes !== undefined) body.cook_time_minutes = recipeData.cookTimeMinutes
      if (recipeData.difficulty !== undefined) body.difficulty = recipeData.difficulty
      if (recipeData.imageUrl !== undefined) body.image_url = recipeData.imageUrl
      if (recipeData.source !== undefined) body.source = recipeData.source
      if (recipeData.nutritionInfo !== undefined) body.nutrition_info = recipeData.nutritionInfo

      if (recipeData.ingredients !== undefined) {
        body.ingredients = recipeData.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        }))
      }

      if (recipeData.steps !== undefined) {
        body.steps = recipeData.steps.map((step) => ({
          step_number: step.stepNumber,
          instruction: step.instruction,
          duration_minutes: step.durationMinutes,
        }))
      }

      if (recipeData.tags !== undefined) {
        body.tags = recipeData.tags
      }

      if (recipeData.translations !== undefined) {
        body.translations = recipeData.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          description: t.description,
        }))
      }

      const { data, error: fetchError } = await useFetch(`/api/recipes/${id}`, {
        method: 'PATCH',
        body,
      })

      if (fetchError.value) throw fetchError.value
      if (data.value?.error) throw new Error(data.value.error)

      return data.value as Recipe
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update recipe'
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteRecipe = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await useFetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      })

      if (fetchError.value) throw fetchError.value
      if (data.value?.error) throw new Error(data.value.error)

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete recipe'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    createRecipe,
    updateRecipe,
    deleteRecipe,
  }
}
