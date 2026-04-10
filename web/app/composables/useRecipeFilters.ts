/**
 * useRecipeFilters - 食谱筛选状态管理 + URL 参数同步
 *
 * 所有筛选状态自动同步到 URL，支持分享链接
 * 支持多维度筛选：分类、菜系、难度、时间、口味、食材、营养、排序
 */

export interface NutritionRange {
  minCalories?: number
  maxCalories?: number
  minProtein?: number
  maxProtein?: number
  minCarbs?: number
  maxCarbs?: number
  minFat?: number
  maxFat?: number
}

export interface RecipeFilterState {
  search: string
  category: string
  cuisine: string
  difficulty: 'easy' | 'medium' | 'hard' | ''
  maxTime: number | undefined
  minTime: number | undefined
  ingredients: string[]
  taste: string[]
  sort: 'latest' | 'popular' | 'rating' | 'quickest' | ''
  minRating: number | undefined
  nutritionRange: NutritionRange
}

export type SortOption = 'latest' | 'popular' | 'rating' | 'quickest'

export const SORT_OPTIONS: Array<{ value: SortOption; labelKey: string }> = [
  { value: 'latest', labelKey: 'sort.latest' },
  { value: 'popular', labelKey: 'sort.popular' },
  { value: 'rating', labelKey: 'sort.highestRated' },
  { value: 'quickest', labelKey: 'sort.quickest' },
]

export const useRecipeFilters = () => {
  const route = useRoute()
  const router = useRouter()
  const { locale: _locale } = useI18n()

  // ─── State ─────────────────────────────────────────────────────────────────
  const search = ref('')
  const category = ref('')
  const cuisine = ref('')
  const difficulty = ref<'' | 'easy' | 'medium' | 'hard'>('')
  const maxTime = ref<number | undefined>(undefined)
  const minTime = ref<number | undefined>(undefined)
  const ingredients = ref<string[]>([])
  const taste = ref<string[]>([])
  const sort = ref<SortOption | ''>('')
  const minRating = ref<number | undefined>(undefined)
  const nutritionRange = ref<NutritionRange>({})

  // ─── URL Sync ────────────────────────────────────────────────────────────────
  const parseUrlParams = () => {
    const q = route.query
    search.value = (q.q as string) || ''
    category.value = (q.category as string) || ''
    cuisine.value = (q.cuisine as string) || ''
    difficulty.value = (q.difficulty as 'easy' | 'medium' | 'hard' | '') || ''
    maxTime.value = q.maxTime ? Number(q.maxTime) : undefined
    minTime.value = q.minTime ? Number(q.minTime) : undefined
    ingredients.value = q.ingredients ? String(q.ingredients).split(',').filter(Boolean) : []
    taste.value = q.taste ? String(q.taste).split(',').filter(Boolean) : []
    sort.value = (q.sort as SortOption | '') || ''
    minRating.value = q.minRating ? Number(q.minRating) : undefined
    nutritionRange.value = {
      minCalories: q.minCalories ? Number(q.minCalories) : undefined,
      maxCalories: q.maxCalories ? Number(q.maxCalories) : undefined,
      minProtein: q.minProtein ? Number(q.minProtein) : undefined,
      maxProtein: q.maxProtein ? Number(q.maxProtein) : undefined,
      minCarbs: q.minCarbs ? Number(q.minCarbs) : undefined,
      maxCarbs: q.maxCarbs ? Number(q.maxCarbs) : undefined,
      minFat: q.minFat ? Number(q.minFat) : undefined,
      maxFat: q.maxFat ? Number(q.maxFat) : undefined,
    }
  }

  const syncToUrl = () => {
    const query: Record<string, string> = {}
    if (search.value) query.q = search.value
    if (category.value) query.category = category.value
    if (cuisine.value) query.cuisine = cuisine.value
    if (difficulty.value) query.difficulty = difficulty.value
    if (maxTime.value !== undefined) query.maxTime = String(maxTime.value)
    if (minTime.value !== undefined) query.minTime = String(minTime.value)
    if (ingredients.value.length > 0) query.ingredients = ingredients.value.join(',')
    if (taste.value.length > 0) query.taste = taste.value.join(',')
    if (sort.value) query.sort = sort.value
    if (minRating.value !== undefined) query.minRating = String(minRating.value)
    const n = nutritionRange.value
    if (n.minCalories !== undefined) query.minCalories = String(n.minCalories)
    if (n.maxCalories !== undefined) query.maxCalories = String(n.maxCalories)
    if (n.minProtein !== undefined) query.minProtein = String(n.minProtein)
    if (n.maxProtein !== undefined) query.maxProtein = String(n.maxProtein)
    if (n.minCarbs !== undefined) query.minCarbs = String(n.minCarbs)
    if (n.maxCarbs !== undefined) query.maxCarbs = String(n.maxCarbs)
    if (n.minFat !== undefined) query.minFat = String(n.minFat)
    if (n.maxFat !== undefined) query.maxFat = String(n.maxFat)

    router.replace({ query })
  }

  // Initialise from URL on first load
  parseUrlParams()

  // Watch all state and sync to URL
  watch(
    [search, category, cuisine, difficulty, maxTime, minTime, ingredients, taste, sort, minRating, nutritionRange],
    () => syncToUrl(),
    { deep: true }
  )

  // ─── Computed ───────────────────────────────────────────────────────────────
  /** Whether any filter (other than defaults) is active */
  const hasActiveFilters = computed(() => {
    return (
      search.value !== '' ||
      category.value !== '' ||
      cuisine.value !== '' ||
      difficulty.value !== '' ||
      maxTime.value !== undefined ||
      minTime.value !== undefined ||
      ingredients.value.length > 0 ||
      taste.value.length > 0 ||
      sort.value !== '' ||
      minRating.value !== undefined ||
      Object.values(nutritionRange.value).some(v => v !== undefined)
    )
  })

  /** Active filter count (for badge) */
  const activeFilterCount = computed(() => {
    let count = 0
    if (search.value) count++
    if (category.value) count++
    if (cuisine.value) count++
    if (difficulty.value) count++
    if (maxTime.value !== undefined) count++
    if (minTime.value !== undefined) count++
    if (ingredients.value.length > 0) count++
    if (taste.value.length > 0) count++
    if (sort.value) count++
    if (minRating.value !== undefined) count++
    const n = nutritionRange.value
    const nutritionCount = [n.minCalories, n.maxCalories, n.minProtein, n.maxProtein, n.minCarbs, n.maxCarbs, n.minFat, n.maxFat].filter(v => v !== undefined).length
    return count + nutritionCount
  })

  // ─── Build API filters ───────────────────────────────────────────────────────
  const buildApiFilters = (): Record<string, string> => {
    const filters: Record<string, string> = {}
    if (search.value) filters.search = search.value
    if (category.value) filters.category = category.value
    if (cuisine.value) filters.cuisine = cuisine.value
    if (difficulty.value) filters.difficulty = difficulty.value
    if (maxTime.value) filters.max_time = String(maxTime.value)
    if (minTime.value) filters.min_time = String(minTime.value)
    if (ingredients.value.length > 0) filters.ingredients = ingredients.value.join(',')
    if (taste.value.length > 0) filters.taste = taste.value.join(',')
    if (sort.value) filters.sort = sort.value === 'popular' ? 'popular' : sort.value === 'rating' ? 'rating' : sort.value === 'quickest' ? 'quickest' : sort.value
    if (minRating.value) filters.min_rating = String(minRating.value)
    const n = nutritionRange.value
    if (n.minCalories !== undefined) filters.min_calories = String(n.minCalories)
    if (n.maxCalories !== undefined) filters.max_calories = String(n.maxCalories)
    if (n.minProtein !== undefined) filters.min_protein = String(n.minProtein)
    if (n.maxProtein !== undefined) filters.max_protein = String(n.maxProtein)
    if (n.minCarbs !== undefined) filters.min_carbs = String(n.minCarbs)
    if (n.maxCarbs !== undefined) filters.max_carbs = String(n.maxCarbs)
    if (n.minFat !== undefined) filters.min_fat = String(n.minFat)
    if (n.maxFat !== undefined) filters.max_fat = String(n.maxFat)
    return filters
  }

  // ─── Actions ────────────────────────────────────────────────────────────────
  const setSort = (val: SortOption | '') => {
    sort.value = val
  }

  const setCategory = (val: string) => {
    category.value = val
  }

  const setCuisine = (val: string) => {
    cuisine.value = val
  }

  const setDifficulty = (val: '' | 'easy' | 'medium' | 'hard') => {
    difficulty.value = val
  }

  const setMaxTime = (val: number | undefined) => {
    maxTime.value = val
  }

  const setMinTime = (val: number | undefined) => {
    minTime.value = val
  }

  const setIngredients = (val: string[]) => {
    ingredients.value = val
  }

  const setTaste = (val: string[]) => {
    taste.value = val
  }

  const setMinRating = (val: number | undefined) => {
    minRating.value = val
  }

  const setNutritionRange = (val: NutritionRange) => {
    nutritionRange.value = val
  }

  const setSearch = (val: string) => {
    search.value = val
  }

  const clearAll = () => {
    search.value = ''
    category.value = ''
    cuisine.value = ''
    difficulty.value = ''
    maxTime.value = undefined
    minTime.value = undefined
    ingredients.value = []
    taste.value = []
    sort.value = ''
    minRating.value = undefined
    nutritionRange.value = {}
  }

  return {
    // State
    search,
    category,
    cuisine,
    difficulty,
    maxTime,
    minTime,
    ingredients,
    taste,
    sort,
    minRating,
    nutritionRange,
    // Computed
    hasActiveFilters,
    activeFilterCount,
    // Actions
    setSort,
    setCategory,
    setCuisine,
    setDifficulty,
    setMaxTime,
    setMinTime,
    setIngredients,
    setTaste,
    setMinRating,
    setNutritionRange,
    setSearch,
    clearAll,
    // Utilities
    buildApiFilters,
    parseUrlParams,
    syncToUrl,
  }
}
