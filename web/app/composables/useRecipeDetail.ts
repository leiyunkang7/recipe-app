import type { Recipe } from '~/types'

export function useRecipeDetail() {
  const { t } = useI18n()
  const route = useRoute()
  const { fetchRecipeById, incrementViews, loading, error } = useRecipes()
  const { isFavorite: checkFavorite, toggleFavorite: toggleFav } = useFavorites()

  const recipe = ref<Recipe | null>(null)
  const isMobile = ref(true)
  const selectedIngredients = ref<string[]>([])

  const isFavorite = computed(() => {
    if (!recipe.value) return false
    return checkFavorite(recipe.value.id)
  })
  const currentStep = ref(0)
  const expandedSteps = ref<Set<number>>(new Set())

  const pageTitle = computed(() => 
    recipe.value ? `${recipe.value.title} - ${t('app.title')}` : t('app.title')
  )

  const metaDescription = computed(() => {
    if (!recipe.value) return t('app.subtitle')
    const parts: string[] = []
    if (recipe.value.category) parts.push(recipe.value.category)
    if (totalTime.value > 0) parts.push(`${totalTime.value}${t('unit.minutes')}`)
    if (recipe.value.difficulty) parts.push(t(`difficulty.${recipe.value.difficulty}`))
    if (recipe.value.servings) parts.push(`${recipe.value.servings}${t('unit.servings')}`)
    return parts.length > 0 
      ? `${recipe.value.title} - ${parts.join(' | ')}. ${recipe.value.description || ''}`
      : (recipe.value.description || t('app.subtitle'))
  })

  const seoKeywords = computed(() => {
    if (!recipe.value) return []
    const keywords = [recipe.value.title, recipe.value.category, recipe.value.cuisine].filter(Boolean)
    if (recipe.value.tags) keywords.push(...recipe.value.tags)
    return keywords.join(', ')
  })

  const difficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
      case 'hard': return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
    }
  }

  const difficultyLabel = (difficulty: string) => t(`difficulty.${difficulty}`)

  const totalTime = computed(() => {
    if (!recipe.value) return 0
    const prep = Number(recipe.value.prepTimeMinutes) || 0
    const cook = Number(recipe.value.cookTimeMinutes) || 0
    return prep + cook
  })

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

  const checkMobile = () => {
    isMobile.value = window.innerWidth < 1024
  }

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
    if (expandedSteps.value.has(index)) {
      expandedSteps.value.delete(index)
    } else {
      expandedSteps.value.add(index)
    }
    expandedSteps.value = new Set(expandedSteps.value)
  }

  const loadRecipe = async () => {
    recipe.value = await fetchRecipeById(route.params.id as string)
    if (recipe.value) {
      incrementViews(route.params.id as string)
    }
  }

  const init = async () => {
    await loadRecipe()
    checkMobile()
    window.addEventListener('resize', checkMobile)
  }

  const cleanup = () => {
    window.removeEventListener('resize', checkMobile)
  }

  watch(() => useI18n().locale.value, async () => {
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
    pageTitle,
    metaDescription,
    seoKeywords,
    totalTime,
    nutritionInfo,
    difficultyColor,
    difficultyLabel,
    toggleIngredient,
    toggleFavorite,
    toggleStepExpand,
    init,
    cleanup,
  }
}
