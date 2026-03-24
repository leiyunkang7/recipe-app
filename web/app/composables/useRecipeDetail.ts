import type { Recipe } from '~/types'

export function useRecipeDetail() {
  const { t, locale } = useI18n()
  const route = useRoute()
  const { fetchRecipeById, incrementViews, loading, error } = useRecipes()
  const { isFavorite: checkFavorite, toggleFavorite: toggleFav } = useFavorites()

  const recipe = ref<Recipe | null>(null)
  const selectedIngredients = ref<string[]>([])

  // Use centralized breakpoint composable - recipe detail uses lg breakpoint (1024px)
  const { isDesktop } = useBreakpoint()
  const isMobile = computed(() => !isDesktop.value)

  // SEO-related computed properties
  const totalTime = computed(() => {
    if (!recipe.value) return 0
    const prep = Number(recipe.value.prepTimeMinutes) || 0
    const cook = Number(recipe.value.cookTimeMinutes) || 0
    return prep + cook
  })

  const isFavorite = computed(() => {
    if (!recipe.value) return false
    return checkFavorite(recipe.value.id)
  })
  const currentStep = ref(0)
  const expandedSteps = ref<number[]>([])

  const nutritionInfo = computed(() => {
    if (!recipe.value?.nutritionInfo) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      }
    }
    return recipe.value.nutritionInfo
  })

  const toggleIngredient = (name: string) => {
    if (selectedIngredients.value.includes(name)) {
      selectedIngredients.value = selectedIngredients.value.filter(i => i !== name)
    } else {
      selectedIngredients.value.push(name)
    }
  }

  const toggleFavorite = async () => {
    if (!recipe.value) return
    await toggleFav(recipe.value.id)
  }

  const toggleStepExpand = (index: number) => {
    const idx = expandedSteps.value.indexOf(index)
    if (idx !== -1) {
      expandedSteps.value.splice(idx, 1)
    } else {
      expandedSteps.value.push(index)
    }
  }

  const loadRecipe = async () => {
    const id = route.params.id as string
    recipe.value = await fetchRecipeById(id)
    if (recipe.value) {
      incrementViews(id)
    }
  }

  const init = async () => {
    await loadRecipe()
  }

  watch(locale, async () => {
    // Skip if already loading to avoid race conditions
    if (loading.value) return
    await loadRecipe()
  })

  return {
    recipe,
    loading,
    error,
    isMobile,
    selectedIngredients,
    isFavorite,
    currentStep,
    expandedSteps,
    totalTime,
    nutritionInfo,
    toggleIngredient,
    toggleFavorite,
    toggleStepExpand,
    init,
  }
}
