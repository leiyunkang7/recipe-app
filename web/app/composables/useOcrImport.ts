import { ref } from 'vue'

export interface ExtractedIngredient {
  name: string
  amount: number | string
  unit: string
}

export function useOcrImport() {
  const extracting = ref(false)
  const error = ref<string | null>(null)
  const extractedIngredients = ref<ExtractedIngredient[]>([])
  const previewImage = ref<string | null>(null)

  const extractFromFile = async (file: File): Promise<ExtractedIngredient[]> => {
    extracting.value = true
    error.value = null
    extractedIngredients.value = []

    try {
      // Create preview
      previewImage.value = URL.createObjectURL(file)

      // Convert to base64
      const base64 = await fileToBase64(file)

      const result = await $fetch<{
        success: boolean
        ingredients?: ExtractedIngredient[]
        error?: string
      }>('/api/ocr/extract-ingredients', {
        method: 'POST',
        body: { imageBase64: base64 },
      })

      if (!result.success || !result.ingredients) {
        error.value = result.error || 'Failed to extract ingredients'
        return []
      }

      extractedIngredients.value = result.ingredients
      return result.ingredients
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed'
      error.value = message
      return []
    } finally {
      extracting.value = false
    }
  }

  const extractFromUrl = async (imageUrl: string): Promise<ExtractedIngredient[]> => {
    extracting.value = true
    error.value = null
    extractedIngredients.value = []
    previewImage.value = imageUrl

    try {
      const result = await $fetch<{
        success: boolean
        ingredients?: ExtractedIngredient[]
        error?: string
      }>('/api/ocr/extract-ingredients', {
        method: 'POST',
        body: { imageUrl },
      })

      if (!result.success || !result.ingredients) {
        error.value = result.error || 'Failed to extract ingredients'
        return []
      }

      extractedIngredients.value = result.ingredients
      return result.ingredients
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed'
      error.value = message
      return []
    } finally {
      extracting.value = false
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove data URL prefix if present
        const base64 = result.includes(',') ? result.split(',')[1] : result
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const clearExtraction = () => {
    if (previewImage.value) {
      URL.revokeObjectURL(previewImage.value)
    }
    previewImage.value = null
    extractedIngredients.value = []
    error.value = null
  }

  const clearError = () => {
    error.value = null
  }

  return {
    extracting,
    error,
    extractedIngredients,
    previewImage,
    extractFromFile,
    extractFromUrl,
    clearExtraction,
    clearError,
  }
}
