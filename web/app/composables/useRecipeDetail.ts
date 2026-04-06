import type { Recipe } from '~/types'

export function useRecipeDetail() {
  const { locale } = useI18n()
  const route = useRoute()
  const { fetchRecipeById, incrementViews, error } = useRecipes()
  const { isFavorite: checkFavorite, toggleFavorite: toggleFav } = useFavorites()
  const { calculatePerServingNutrition } = useNutritionCalculator()

  const recipe = shallowRef<Recipe | null>(null)
  // Use ref (not shallowRef) to ensure Set replacement triggers reactivity
  // Set operations (add/delete) create new Set instance which ref properly tracks
  const selectedIngredientsSet = ref<Set<string>>(new Set())
  const isLoadingRecipe = ref(false)

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
  const currentStep = shallowRef(0)
  // Use ref (not shallowRef) to ensure Set replacement triggers reactivity
  const expandedStepsSet = ref<Set<number>>(new Set())

  // Nutrition info - use stored or calculate from ingredients (per serving)
  const nutritionInfo = computed(() => {
    if (!recipe.value) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      }
    }

    const servings = recipe.value.servings || 1

    // If we have nutrition info, calculate per-serving values
    if (recipe.value.nutritionInfo?.calories ||
        recipe.value.nutritionInfo?.protein ||
        recipe.value.nutritionInfo?.carbs ||
        recipe.value.nutritionInfo?.fat ||
        recipe.value.nutritionInfo?.fiber) {
      const info = recipe.value.nutritionInfo
      return {
        calories: info?.calories ? Math.round(info.calories / servings) : 0,
        protein: info?.protein ? Math.round(info.protein / servings * 10) / 10 : 0,
        carbs: info?.carbs ? Math.round(info.carbs / servings * 10) / 10 : 0,
        fat: info?.fat ? Math.round(info.fat / servings * 10) / 10 : 0,
        fiber: info?.fiber ? Math.round(info.fiber / servings * 10) / 10 : 0,
      }
    }

    // Calculate from ingredients
    if (recipe.value.ingredients && recipe.value.ingredients.length > 0) {
      const calculated = calculatePerServingNutrition(recipe.value.ingredients, servings)
      return {
        calories: calculated.calories,
        protein: calculated.protein,
        carbs: calculated.carbs,
        fat: calculated.fat,
        fiber: calculated.fiber,
      }
    }

    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    }
  })

  const toggleIngredient = (name: string) => {
    const newSet = new Set(selectedIngredientsSet.value)
    if (newSet.has(name)) {
      newSet.delete(name)
    } else {
      newSet.add(name)
    }
    selectedIngredientsSet.value = newSet
  }

  const toggleFavorite = async () => {
    if (!recipe.value) return
    await toggleFav(recipe.value.id)
  }

  const toggleStepExpand = (index: number) => {
    const newSet = new Set(expandedStepsSet.value)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    expandedStepsSet.value = newSet
  }

  const loadRecipe = async () => {
    const id = route.params.id as string
    isLoadingRecipe.value = true
    try {
      recipe.value = await fetchRecipeById(id)
      if (recipe.value) {
        // Await incrementViews to ensure view count is recorded before navigation
        // Use catch to prevent view count errors from affecting user experience
        incrementViews(id).catch(() => {
          // Silently handle - view counts are not critical
        })
      }
    } finally {
      isLoadingRecipe.value = false
    }
  }

  const init = async () => {
    await loadRecipe()
  }

  watch(locale, async () => {
    // Skip if already loading to avoid race conditions
    if (isLoadingRecipe.value) return
    await loadRecipe()
  })

  return {
    recipe,
    loading: isLoadingRecipe,
    error,
    isMobile,
    selectedIngredients: selectedIngredientsSet,
    isFavorite,
    currentStep,
    expandedSteps: expandedStepsSet,
    totalTime,
    nutritionInfo,
    toggleIngredient,
    toggleFavorite,
    toggleStepExpand,
    init,
  }
}
