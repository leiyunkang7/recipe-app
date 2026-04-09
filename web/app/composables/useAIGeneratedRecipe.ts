import { ref } from 'vue'
import type { CreateRecipeDTO } from '@recipe-app/shared-types'

export interface IdentifiedDish {
  dishName: string
  cuisine: string
  confidence: number
}

export interface AIGeneratedRecipe {
  identifiedDish: IdentifiedDish
  recipe: CreateRecipeDTO
  imageDataUrl?: string
}

export function useAIGeneratedRecipe() {
  const isIdentifying = ref(false)
  const isGenerating = ref(false)
  const identifiedDish = ref<IdentifiedDish | null>(null)
  const generatedRecipe = ref<CreateRecipeDTO | null>(null)
  const capturedImageUrl = ref<string | null>(null)
  const error = ref<string | null>(null)

  const identifyDish = async (imageBase64: string): Promise<IdentifiedDish | null> => {
    isIdentifying.value = true
    error.value = null

    try {
      const result = await $fetch<{
        success: boolean
        dishName?: string
        cuisine?: string
        confidence?: number
        error?: string
      }>('/api/ai/identify-dish', {
        method: 'POST',
        body: { imageBase64 },
      })

      if (!result.success || !result.dishName) {
        error.value = result.error || 'Failed to identify dish'
        return null
      }

      identifiedDish.value = {
        dishName: result.dishName,
        cuisine: result.cuisine || 'Unknown',
        confidence: result.confidence || 0,
      }

      return identifiedDish.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to identify dish'
      return null
    } finally {
      isIdentifying.value = false
    }
  }

  const generateRecipe = async (
    dishName: string,
    cuisine?: string,
    imageBase64?: string
  ): Promise<CreateRecipeDTO | null> => {
    isGenerating.value = true
    error.value = null

    try {
      const result = await $fetch<{
        success: boolean
        recipe?: CreateRecipeDTO
        error?: string
      }>('/api/ai/generate-recipe', {
        method: 'POST',
        body: {
          dishName,
          cuisine,
          imageBase64,
        },
      })

      if (!result.success || !result.recipe) {
        error.value = result.error || 'Failed to generate recipe'
        return null
      }

      generatedRecipe.value = result.recipe
      return result.recipe
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to generate recipe'
      return null
    } finally {
      isGenerating.value = false
    }
  }

  const identifyAndGenerate = async (imageBase64: string, imageDataUrl?: string): Promise<AIGeneratedRecipe | null> => {
    error.value = null
    capturedImageUrl.value = imageDataUrl || null

    // Step 1: Identify the dish
    const dish = await identifyDish(imageBase64)
    if (!dish) {
      return null
    }

    // Step 2: Generate recipe for the identified dish
    const recipe = await generateRecipe(dish.dishName, dish.cuisine, imageBase64)
    if (!recipe) {
      return null
    }

    return {
      identifiedDish: dish,
      recipe,
      imageDataUrl: imageDataUrl,
    }
  }

  const saveRecipe = async (): Promise<{ success: boolean; recipeId?: string; error?: string }> => {
    if (!generatedRecipe.value) {
      return { success: false, error: 'No recipe to save' }
    }

    try {
      const result = await $fetch<{ success: boolean; data?: { id: string }; error?: string }>(
        '/api/recipes',
        {
          method: 'POST',
          body: generatedRecipe.value,
        }
      )

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to save recipe' }
      }

      return { success: true, recipeId: result.data?.id }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to save recipe' }
    }
  }

  const reset = () => {
    isIdentifying.value = false
    isGenerating.value = false
    identifiedDish.value = null
    generatedRecipe.value = null
    capturedImageUrl.value = null
    error.value = null
  }

  const clearError = () => {
    error.value = null
  }

  return {
    isIdentifying,
    isGenerating,
    identifiedDish,
    generatedRecipe,
    capturedImageUrl,
    error,
    identifyDish,
    generateRecipe,
    identifyAndGenerate,
    saveRecipe,
    reset,
    clearError,
  }
}
