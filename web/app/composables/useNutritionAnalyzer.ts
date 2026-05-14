/**
 * useNutritionAnalyzer - Composable for analyzing recipe nutrition via API
 *
 * 功能：
 * - 调用后端 API 分析食材营养成分
 * - 获取每份营养数据
 * - 获取每日建议摄入量百分比
 * - 获取未识别食材列表
 */

import type { IngredientInput } from '@recipe-app/nutrition'

export interface NutritionAnalysisResponse {
  total: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  perServing: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  servings: number
  analyzedIngredients: Array<{
    name: string
    amount: number
    unit: string
    grams: number
    matchedAs?: string
    nutrition: {
      calories: number
      protein: number
      carbs: number
      fat: number
      fiber: number
    }
  }>
  unknownIngredients: string[]
  display: Record<string, string | number>
  dailyValuePercentages: Record<string, number>
}

export function useNutritionAnalyzer() {
  const analyzing = ref(false)
  const error = ref<string | null>(null)

  const analyzeNutrition = async (
    ingredients: IngredientInput[],
    servings?: number
  ): Promise<NutritionAnalysisResponse | null> => {
    analyzing.value = true
    error.value = null

    try {
      const response = await $fetch('/api/nutrition/analyze', {
        method: 'POST',
        body: {
          ingredients,
          servings,
        },
      })

      if (response.success && response.data) {
        return response.data as NutritionAnalysisResponse
      } else {
        error.value = 'Failed to analyze nutrition'
        return null
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      return null
    } finally {
      analyzing.value = false
    }
  }

  const getKnownIngredients = async (): Promise<{ id: string; name: string; aliases?: string[]; defaultUnit?: string }[]> => {
    try {
      const response = await $fetch('/api/nutrition/ingredients')
      if (response.success && response.data) {
        return response.data.ingredients
      }
      return []
    } catch {
      return []
    }
  }

  return {
    analyzing: readonly(analyzing),
    error: readonly(error),
    analyzeNutrition,
    getKnownIngredients,
  }
}
