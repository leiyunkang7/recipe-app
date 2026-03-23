import type { Recipe } from '~/types'

export function useSharePosterLogic(recipe: Recipe) {
  const POSTER_WIDTH = 1080
  const POSTER_HEIGHT = 1350

  const totalTime = computed(() => {
    const prep = Number(recipe.prepTimeMinutes) || 0
    const cook = Number(recipe.cookTimeMinutes) || 0
    return prep + cook
  })

  const difficultyConfig = computed(() => {
    switch (recipe.difficulty) {
      case 'easy': return { label: '简单', bg: 'bg-green-500', text: 'text-white' }
      case 'medium': return { label: '中等', bg: 'bg-amber-500', text: 'text-white' }
      case 'hard': return { label: '困难', bg: 'bg-red-500', text: 'text-white' }
      default: return { label: '未知', bg: 'bg-gray-500', text: 'text-white' }
    }
  })

  const topIngredients = computed(() => {
    return recipe.ingredients.slice(0, 5).map(ing => ({
      name: ing.name,
      amount: `${ing.amount}${ing.unit}`
    }))
  })

  const servingsText = computed(() => `${recipe.servings}人份`)

  const gradientColors = computed(() => {
    const categoryColors: Record<string, [string, string]> = {
      '家常菜': ['#FF6B35', '#F7C59F'],
      '快手菜': ['#2EC4B6', '#CBF3F0'],
      '甜点': ['#FF69B4', '#FFC1E3'],
      '早餐': ['#FFD93D', '#FFF3B0'],
      '晚餐': ['#6BCB77', '#D4EDDA'],
      '午餐': ['#4D96FF', '#D0E8FF'],
      '饮品': ['#9B5DE5', '#E0C3FC'],
      '零食': ['#F15BB5', '#FCC8E5'],
    }
    return categoryColors[recipe.category] || ['#f97316', '#fde68a']
  })

  const timeText = computed(() => {
    const mins = totalTime.value
    if (mins >= 60) {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
    }
    return `${mins}分钟`
  })

  const placeholderGradient = computed(() => {
    const [c1, c2] = gradientColors.value
    return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`
  })

  const patternSvg = computed(() => {
    return `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
  })

  return {
    POSTER_WIDTH,
    POSTER_HEIGHT,
    totalTime,
    difficultyConfig,
    topIngredients,
    servingsText,
    gradientColors,
    timeText,
    placeholderGradient,
    patternSvg,
  }
}
