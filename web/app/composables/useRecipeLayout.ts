import { computed } from 'vue'
import type { Recipe } from '~/types'

export function useRecipeLayout(recipes: () => Recipe[]) {
  const leftColumnRecipes = computed(() => {
    return recipes().filter((_, i) => i % 2 === 0)
  })

  const rightColumnRecipes = computed(() => {
    return recipes().filter((_, i) => i % 2 === 1)
  })

  return {
    leftColumnRecipes,
    rightColumnRecipes,
  }
}

export function useCategorySelect(selectedCategory: () => string, setSelectedCategory: (value: string) => void) {
  const selectCategory = (name: string) => {
    setSelectedCategory(selectedCategory() === name ? '' : name)
  }

  return {
    selectCategory,
  }
}
