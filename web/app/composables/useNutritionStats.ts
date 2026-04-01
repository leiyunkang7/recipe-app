/**
 * useNutritionStats - 营养素摄入统计 Composable
 *
 * 功能：
 * - 从收藏的食谱中汇总营养素摄入数据
 * - 支持日/周视图
 * - 从 localStorage 读取用户日志记录
 */

import type { NutritionInfo, Recipe } from '~/types'

export interface DailyNutrition {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export interface NutritionSummary {
  daily: DailyNutrition[]
  weeklyTotals: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  dailyAverage: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
}

// 从 localStorage 读取用户标记的"今天吃过"的食谱ID列表
const EATEN_RECIPES_KEY = 'nutrition_eaten_recipes'
const EATEN_DATE_KEY = 'nutrition_eaten_date'

const getEatenRecipeIds = (date: string): string[] => {
  try {
    const stored = localStorage.getItem(`${EATEN_RECIPES_KEY}_${date}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const addEatenRecipe = (recipeId: string, date: string) => {
  const ids = getEatenRecipeIds(date)
  if (!ids.includes(recipeId)) {
    ids.push(recipeId)
    localStorage.setItem(`${EATEN_RECIPES_KEY}_${date}`, JSON.stringify(ids))
    localStorage.setItem(EATEN_DATE_KEY, date)
  }
}

const removeEatenRecipe = (recipeId: string, date: string) => {
  const ids = getEatenRecipeIds(date)
  const idx = ids.indexOf(recipeId)
  if (idx > -1) {
    ids.splice(idx, 1)
    localStorage.setItem(`${EATEN_RECIPES_KEY}_${date}`, JSON.stringify(ids))
  }
}

const isRecipeEaten = (recipeId: string, date: string): boolean => {
  return getEatenRecipeIds(date).includes(recipeId)
}

// 格式化日期为 YYYY-MM-DD
const formatDate = (d: Date): string => {
  return d.toISOString().split('T')[0]
}

// 获取今天日期字符串
const getToday = (): string => formatDate(new Date())

// 获取最近N天的日期列表
const getRecentDays = (n: number): string[] => {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }
  return days
}

// 合并营养素数据
const mergeNutrition = (acc: NutritionInfo, recipe: Recipe): NutritionInfo => {
  return {
    calories: (acc.calories || 0) + (recipe.nutritionInfo?.calories || 0),
    protein: (acc.protein || 0) + (recipe.nutritionInfo?.protein || 0),
    carbs: (acc.carbs || 0) + (recipe.nutritionInfo?.carbs || 0),
    fat: (acc.fat || 0) + (recipe.nutritionInfo?.fat || 0),
    fiber: (acc.fiber || 0) + (recipe.nutritionInfo?.fiber || 0),
  }
}

export const useNutritionStats = () => {
  const { $supabase } = useNuxtApp()
  const { favoriteIds } = useFavorites()

  const loading = ref(false)
  const selectedDate = ref(getToday())
  const viewMode = ref<'daily' | 'weekly'>('weekly')
  const weeklyRecipes = shallowRef<Recipe[]>([])
  const dailyRecipes = shallowRef<Recipe[]>([])

  // 获取本周的日期范围 (周一到周日)
  const getWeekRange = (): string[] => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0=周日, 1=周一...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    const days: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      days.push(formatDate(d))
    }
    return days
  }

  // 本周汇总数据
  const weeklySummary = computed<NutritionSummary>(() => {
    const weekDays = getWeekRange()
    const daily: DailyNutrition[] = weekDays.map(date => {
      const eatenIds = getEatenRecipeIds(date)
      const dayRecipes = weeklyRecipes.value.filter(r => eatenIds.includes(r.id))
      const nutrition = dayRecipes.reduce<NutritionInfo>((acc, r) => mergeNutrition(acc, r), {})
      return {
        date,
        calories: Math.round(nutrition.calories || 0),
        protein: Math.round((nutrition.protein || 0) * 10) / 10,
        carbs: Math.round((nutrition.carbs || 0) * 10) / 10,
        fat: Math.round((nutrition.fat || 0) * 10) / 10,
        fiber: Math.round((nutrition.fiber || 0) * 10) / 10,
      }
    })

    const totals = daily.reduce<NutritionSummary['weeklyTotals']>((acc, d) => ({
      calories: acc.calories + d.calories,
      protein: acc.protein + d.protein,
      carbs: acc.carbs + d.carbs,
      fat: acc.fat + d.fat,
      fiber: acc.fiber + d.fiber,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })

    const avgDivisor = daily.filter(d => d.calories > 0).length || 1
    return {
      daily,
      weeklyTotals: totals,
      dailyAverage: {
        calories: Math.round(totals.calories / avgDivisor),
        protein: Math.round(totals.protein / avgDivisor * 10) / 10,
        carbs: Math.round(totals.carbs / avgDivisor * 10) / 10,
        fat: Math.round(totals.fat / avgDivisor * 10) / 10,
        fiber: Math.round(totals.fiber / avgDivisor * 10) / 10,
      }
    }
  })

  // 今日数据
  const todayNutrition = computed(() => {
    const eatenIds = getEatenRecipeIds(selectedDate.value)
    const eatenRecipes = dailyRecipes.value.filter(r => eatenIds.includes(r.id))
    return eatenRecipes.reduce<NutritionInfo>((acc, r) => mergeNutrition(acc, r), {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0
    })
  })

  // 加载收藏食谱的营养信息
  const loadNutritionData = async () => {
    if (favoriteIds.value.size === 0) {
      weeklyRecipes.value = []
      dailyRecipes.value = []
      return
    }

    loading.value = true
    try {
      // 获取所有收藏食谱的营养信息
      const ids = Array.from(favoriteIds.value)
      const { data, error } = await $supabase
        .from('recipes')
        .select('id, title, nutrition_info')
        .in('id', ids)

      if (error) throw error

      const recipes = (data || []).map(r => ({
        id: r.id,
        title: r.title,
        nutritionInfo: r.nutrition_info as NutritionInfo | undefined,
      })) as Recipe[]

      weeklyRecipes.value = recipes
      dailyRecipes.value = recipes
    } catch (err) {
      console.error('Failed to load nutrition data:', err)
    } finally {
      loading.value = false
    }
  }

  // 标记食谱为已吃
  const markAsEaten = (recipeId: string) => {
    addEatenRecipe(recipeId, selectedDate.value)
  }

  const unmarkAsEaten = (recipeId: string) => {
    removeEatenRecipe(recipeId, selectedDate.value)
  }

  const toggleEaten = (recipeId: string) => {
    if (isRecipeEaten(recipeId, selectedDate.value)) {
      unmarkAsEaten(recipeId)
    } else {
      markAsEaten(recipeId)
    }
  }

  const isEaten = (recipeId: string) => isRecipeEaten(recipeId, selectedDate.value)

  // 推荐摄入量 (基于一般成人每日需求)
  const recommendedDaily = {
    calories: 2000,
    protein: 60,   // g
    carbs: 300,    // g
    fat: 65,       // g
    fiber: 25,     // g
  }

  return {
    loading,
    selectedDate,
    viewMode,
    weeklySummary,
    todayNutrition,
    weeklyRecipes,
    dailyRecipes,
    loadNutritionData,
    markAsEaten,
    unmarkAsEaten,
    toggleEaten,
    isEaten,
    recommendedDaily,
    getToday,
    getRecentDays,
  }
}
