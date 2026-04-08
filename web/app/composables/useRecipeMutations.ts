import type { Recipe, CreateRecipeDTO } from '~/types'
import { useToast } from './useToast'

export const useRecipeMutations = () => {
  const { user } = useAuth()
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const createRecipe = async (recipeData: CreateRecipeDTO): Promise<Recipe | null> => {
    loading.value = true
    error.value = null

    try {
      const body = {
        author_id: recipeData.authorId ?? user.value?.id,
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
      if ((data.value as unknown)?.error) throw new Error((data.value as { error?: string }).error)

      return (data.value as { data?: Recipe })?.data as Recipe
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create recipe'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateRecipe = async (
    id: string,
    recipeData: Partial<CreateRecipeDTO>,
    optimisticOptions?: {
      onOptimisticUpdate?: (updatedData: Partial<CreateRecipeDTO>) => void
      onRollback?: () => void
    }
  ): Promise<Recipe | null> => {
    loading.value = true
    error.value = null

    // Apply optimistic update immediately if provided
    if (optimisticOptions?.onOptimisticUpdate) {
      optimisticOptions.onOptimisticUpdate(recipeData)
    }

    try {
      const body: Record<string, unknown> = {}
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
      if ((data.value as unknown)?.error) throw new Error((data.value as { error?: string }).error)

      toast.success('Recipe updated successfully')
      return (data.value as { data?: Recipe })?.data as Recipe
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update recipe'
      // Rollback on failure
      if (optimisticOptions?.onRollback) {
        optimisticOptions.onRollback()
      }
      toast.error('Failed to update recipe. Please try again.')
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteRecipe = async (
    id: string,
    optimisticOptions?: {
      onOptimisticDelete?: () => void
      onRollback?: () => void
    }
  ): Promise<boolean> => {
    loading.value = true
    error.value = null

    // Apply optimistic delete immediately if provided
    if (optimisticOptions?.onOptimisticDelete) {
      optimisticOptions.onOptimisticDelete()
    }

    try {
      const { data, error: fetchError } = await useFetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      })

      if (fetchError.value) throw fetchError.value
      if ((data.value as { error?: string })?.error) throw new Error((data.value as { error?: string }).error || 'Unknown error')

      toast.success('Recipe deleted successfully')
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete recipe'
      // Rollback on failure
      if (optimisticOptions?.onRollback) {
        optimisticOptions.onRollback()
      }
      toast.error('Failed to delete recipe. Please try again.')
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
