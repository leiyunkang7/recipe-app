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

// Nutrition field keys for iteration
const NUTRITION_FIELDS = [
  'minCalories', 'maxCalories',
  'minProtein', 'maxProtein',
  'minCarbs', 'maxCarbs',
  'minFat', 'maxFat',
] as const

type NutritionField = typeof NUTRITION_FIELDS[number]

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
    const nutrition: NutritionRange = {}
    for (const field of NUTRITION_FIELDS) {
      const key = field.replace(/([A-Z])/g, '_$1').toLowerCase()
      const val = q[key]
      nutrition[field] = val ? Number(val) : undefined
    }
    nutritionRange.value = nutrition
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
    for (const field of NUTRITION_FIELDS) {
      const key = field.replace(/([A-Z])/g, '_$1').toLowerCase()
      if (n[field] !== undefined) query[key] = String(n[field])
    }

    router.replace({ query })
  }

  // Initialise from URL on first load
  parseUrlParams()

  // Debounced URL sync to prevent rapid router.replace calls when multiple filters change
  // e.g., clearAll() triggers 11+ reactive changes but only one router.replace is needed
  let urlSyncTimer: ReturnType<typeof setTimeout> | null = null
  const syncToUrlDebounced = () => {
    if (urlSyncTimer) clearTimeout(urlSyncTimer)
    urlSyncTimer = setTimeout(() => {
      syncToUrl()
      urlSyncTimer = null
    }, 100)
  }

  // Watch all state and sync to URL (debounced to batch rapid changes)
  watch(
    [search, category, cuisine, difficulty, maxTime, minTime, ingredients, taste, sort, minRating, nutritionRange],
    () => syncToUrlDebounced(),
    { deep: true }
  )

  onUnmounted(() => {
    if (urlSyncTimer) {
      clearTimeout(urlSyncTimer)
      urlSyncTimer = null
    }
  })

  // ─── Unified computed: active filters + count + API filters ─────────────────
  // All three values are derived from the same filter state. Computing them
  // together in a single computed avoids scanning 11+ refs three times per
  // reactive tick and guarantees consistent results across all consumers.
  interface FilterDerived {
    hasActive: boolean
    activeCount: number
    api: Record<string, string>
  }

  const filterDerived = computed<FilterDerived>(() => {
    let hasActive = false
    let activeCount = 0

    // Helper: increment count and set hasActive flag
    const mark = (condition: boolean) => {
      if (condition) {
        hasActive = true
        activeCount++
      }
    }

    mark(search.value !== '')
    mark(category.value !== '')
    mark(cuisine.value !== '')
    mark(difficulty.value !== '')
    mark(maxTime.value !== undefined)
    mark(minTime.value !== undefined)
    mark(ingredients.value.length > 0)
    mark(taste.value.length > 0)
    mark(sort.value !== '')
    mark(minRating.value !== undefined)

    const n = nutritionRange.value
    let nutritionCount = 0
    for (const field of NUTRITION_FIELDS) {
      if (n[field] !== undefined) nutritionCount++
    }
    if (nutritionCount > 0) {
      hasActive = true
      activeCount += nutritionCount
    }

    // Build API filter object in the same pass
    const api: Record<string, string> = {}
    if (search.value) api.search = search.value
    if (category.value) api.category = category.value
    if (cuisine.value) api.cuisine = cuisine.value
    if (difficulty.value) api.difficulty = difficulty.value
    if (maxTime.value) api.max_time = String(maxTime.value)
    if (minTime.value) api.min_time = String(minTime.value)
    if (ingredients.value.length > 0) api.ingredients = ingredients.value.join(',')
    if (taste.value.length > 0) api.taste = taste.value.join(',')
    if (sort.value) api.sort = sort.value
    if (minRating.value) api.min_rating = String(minRating.value)
    for (const field of NUTRITION_FIELDS) {
      const key = field.replace(/([A-Z])/g, '_$1').toLowerCase()
      if (n[field] !== undefined) api[key] = String(n[field])
    }

    return { hasActive, activeCount, api }
  })

  const hasActiveFilters = computed(() => filterDerived.value.hasActive)
  const activeFilterCount = computed(() => filterDerived.value.activeCount)

  // Build API filters — returns the memoized computed value.
  // Callers that previously invoked buildApiFilters() now receive the cached
  // result unless filter state has actually changed.
  const buildApiFilters = (): Record<string, string> => filterDerived.value.api

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
