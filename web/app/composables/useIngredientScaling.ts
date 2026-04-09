import type { Ingredient } from '~/types'

export function useIngredientScaling(recipeServings: Ref<number>) {
  // Multiplier options: 0.5x, 1x, 2x, 3x, 4x
  const multiplierOptions = [0.5, 1, 2, 3, 4] as const

  // Current selected multiplier index (default to 1x = index 1)
  const selectedMultiplierIndex = ref(1)

  // Current multiplier value
  const multiplier = computed(() => multiplierOptions[selectedMultiplierIndex.value])

  // Calculate scaled servings based on multiplier
  const scaledServings = computed(() => Math.round(recipeServings.value * multiplier.value))

  // Scale an ingredient amount
  const scaleAmount = (amount: number): number => {
    const scaled = amount * multiplier.value
    // Round to reasonable decimal places
    if (scaled >= 10) {
      return Math.round(scaled)
    } else if (scaled >= 1) {
      return Math.round(scaled * 10) / 10
    } else {
      return Math.round(scaled * 100) / 100
    }
  }

  // Scale an ingredient and return formatted string
  const getScaledAmount = (ingredient: Ingredient): string => {
    const scaled = scaleAmount(ingredient.amount)
    return `${scaled} ${ingredient.unit}`
  }

  // Get scaled ingredients array with scaled amounts
  const getScaledIngredients = (ingredients: Ingredient[]): Array<{
    ingredient: Ingredient
    scaledAmount: string
  }> => {
    return ingredients.map(ing => ({
      ingredient: ing,
      scaledAmount: getScaledAmount(ing),
    }))
  }

  // Decrease multiplier (minimum index 0 = 0.5x)
  const decreaseMultiplier = () => {
    if (selectedMultiplierIndex.value > 0) {
      selectedMultiplierIndex.value--
    }
  }

  // Increase multiplier (maximum index 4 = 4x)
  const increaseMultiplier = () => {
    if (selectedMultiplierIndex.value < multiplierOptions.length - 1) {
      selectedMultiplierIndex.value++
    }
  }

  // Reset to default (1x)
  const resetMultiplier = () => {
    selectedMultiplierIndex.value = 1
  }

  return {
    multiplierOptions,
    selectedMultiplierIndex,
    multiplier,
    scaledServings,
    scaleAmount,
    getScaledAmount,
    getScaledIngredients,
    decreaseMultiplier,
    increaseMultiplier,
    resetMultiplier,
  }
}
