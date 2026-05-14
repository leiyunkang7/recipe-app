<script setup lang="ts">
/**
 * RecipeCardBadges - 食谱卡片底部信息标签组件
 *
 * 提取自 RecipeCardLazy，用于减少不必要的子组件重渲染。
 * 当父组件因搜索高亮等原因更新时，这些标签数据通常不变，
 * 独立组件可避免重复渲染 5+ 个 badge 及其图标。
 *
 * 优化点：
 * - v-memo 包裹每个 badge span，值未变化时跳过整个子树
 * - 预计算 i18n 标签文字到 computed，避免模板中重复调用 t()
 */
import TimerIcon from '~/components/icons/TimerIcon.vue'
import PeopleIcon from '~/components/icons/PeopleIcon.vue'
import EyeIcon from '~/components/icons/EyeIcon.vue'
import FireIcon from '~/components/icons/FireIcon.vue'
import StarIcon from '~/components/icons/StarIcon.vue'
import { calculateTotalTime } from '~/utils/sharedPosterConstants'

const props = withDefaults(defineProps<{
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  views?: number
  averageRating?: number
  ratingCount?: number
  calories?: number
}>(), {
  views: 0,
  averageRating: 0,
  ratingCount: 0,
  calories: 0,
})

const { t } = useI18n()

// Pre-computed i18n labels — only recalculate when locale changes
const minLabel = computed(() => t('recipe.min'))
const servingsLabel = computed(() => t('recipe.servings'))

// Single computed for all badge data — only recalculates when actual values change
const badges = computed(() => {
  const totalTime = calculateTotalTime(props.prepTimeMinutes, props.cookTimeMinutes)
  const avg = props.averageRating ?? 0
  const count = props.ratingCount ?? 0
  const cal = props.calories ?? 0

  return {
    totalTime,
    totalTimeLabel: `${totalTime}${minLabel.value}`,
    servingsText: `${props.servings}${servingsLabel.value}`,
    hasRating: avg > 0 && count > 0,
    ratingValue: Math.round(avg),
    ratingCount: count,
    hasCalories: cal > 0,
    caloriesRounded: Math.round(cal),
  }
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs text-gray-500 dark:text-stone-400">
    <!-- Total Time — memoized: only re-renders when totalTime changes -->
    <span
      v-memo="[badges.totalTimeLabel]"
      class="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs"
    >
      <TimerIcon aria-hidden="true" class="w-3 h-3" />{{ badges.totalTimeLabel }}
    </span>

    <!-- Servings — memoized: only re-renders when servings or locale changes -->
    <span
      v-memo="[badges.servingsText]"
      class="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs"
    >
      <PeopleIcon aria-hidden="true" class="w-3 h-3" />{{ badges.servingsText }}
    </span>

    <!-- Views (conditional) — memoized: only re-renders when views value changes -->
    <span
      v-if="views"
      v-memo="[views]"
      class="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs"
    >
      <EyeIcon aria-hidden="true" class="w-3 h-3" />{{ views }}
    </span>

    <!-- Rating (conditional) — memoized: only re-renders when rating data changes -->
    <span
      v-if="badges.hasRating"
      v-memo="[badges.ratingValue, badges.ratingCount]"
      class="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs"
    >
      <StarIcon aria-hidden="true" class="w-3 h-3 text-amber-400" />{{ badges.ratingValue }}<span class="text-gray-500 dark:text-stone-400 text-[10px]">({{ badges.ratingCount }})</span>
    </span>

    <!-- Calories (conditional) — memoized: only re-renders when calories value changes -->
    <span
      v-if="badges.hasCalories"
      v-memo="[badges.caloriesRounded]"
      class="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs text-red-600 dark:text-red-400"
    >
      <FireIcon aria-hidden="true" class="w-3 h-3" />{{ badges.caloriesRounded }}
    </span>
  </div>
</template>
