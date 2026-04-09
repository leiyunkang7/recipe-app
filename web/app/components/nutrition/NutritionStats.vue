<script setup lang="ts">
/**
 * NutritionStats - 营养素摄入统计组件
 *
 * 功能：
 * - 周视图柱状图（SVG）
 * - 营养素雷达图（SVG）
 * - 日/周切换
 * - 推荐摄入量对比
 *
 * 子组件：
 * - NutritionBarChart.vue    柱状图
 * - NutritionRadarChart.vue   雷达图
 */

import type { DailyNutrition } from '~/composables/useNutritionStats'

interface Props {
  weeklySummary: {
    daily: DailyNutrition[]
    weeklyTotals: { calories: number; protein: number; carbs: number; fat: number; fiber: number }
    dailyAverage: { calories: number; protein: number; carbs: number; fat: number; fiber: number }
  }
  recommendedDaily: { calories: number; protein: number; carbs: number; fat: number; fiber: number }
  viewMode: 'daily' | 'weekly'
}

const props = defineProps<Props>()

const { t } = useI18n()

const nutrients = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const
const nutrientLabels: Record<string, string> = {
  calories: t('nutrition.calories'),
  protein: t('nutrition.protein'),
  carbs: t('nutrition.carbs'),
  fat: t('nutrition.fat'),
  fiber: t('nutrition.dietaryFiber'),
}
const nutrientUnits: Record<string, string> = {
  calories: 'kcal',
  protein: 'g',
  carbs: 'g',
  fat: 'g',
  fiber: 'g',
}

// 使用 Design Token CSS 变量
const nutrientColors: Record<string, string> = {
  calories: 'var(--chart-calories)',
  protein: 'var(--chart-protein)',
  carbs: 'var(--chart-carbs)',
  fat: 'var(--chart-fat)',
  fiber: 'var(--chart-fiber)',
}

// 计算柱状图比例
const maxValues = computed(() => {
  const result: Record<string, number> = {}
  for (const key of nutrients) {
    const maxDaily = Math.max(...props.weeklySummary.daily.map(d => d[key] as number), 0)
    const maxRec = props.recommendedDaily[key]
    result[key] = Math.max(maxDaily, maxRec) * 1.15
  }
  return result
})

const activeNutrient = ref<string>('calories')

// 百分比计算
const percentOf = (value: number, recommended: number) => {
  return recommended > 0 ? Math.round((value / recommended) * 100) : 0
}
</script>

<template>
  <div class="nutrition-stats space-y-6">
    <!-- 营养素选择器 -->
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="key in nutrients"
        :key="key"
        :class="[
          'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
          activeNutrient === key
            ? 'text-white shadow-md'
            : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'
        ]"
        :style="activeNutrient === key ? { backgroundColor: nutrientColors[key] } : {}"
        @click="activeNutrient = key"
      >
        {{ nutrientLabels[key] }}
      </button>
    </div>

    <!-- 柱状图 -->
    <NutritionBarChart
      :daily="weeklySummary.daily"
      :active-nutrient="activeNutrient"
      :recommended-daily="recommendedDaily"
      :max-values="maxValues"
      :nutrient-colors="nutrientColors"
      :nutrient-labels="nutrientLabels"
    />

    <!-- 雷达图 -->
    <NutritionRadarChart
      :daily-average="weeklySummary.dailyAverage"
      :recommended-daily="recommendedDaily"
      :nutrient-labels="nutrientLabels"
      :nutrient-units="nutrientUnits"
      :nutrient-colors="nutrientColors"
    />

    <!-- 周汇总卡片 -->
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="key in nutrients"
        :key="key"
        class="bg-white dark:bg-stone-800 rounded-xl p-3 shadow-sm"
      >
        <div class="flex items-center gap-1.5 mb-1">
          <span
            class="w-2 h-2 rounded-full"
            :style="{ backgroundColor: nutrientColors[key] }"
          />
          <span class="text-xs text-gray-600 dark:text-stone-400">
            {{ nutrientLabels[key] }}
          </span>
        </div>
        <div class="text-lg font-bold text-gray-800 dark:text-stone-100">
          {{ weeklySummary.weeklyTotals[key] }}{{ nutrientUnits[key] }}
        </div>
        <div class="text-xs text-gray-400 dark:text-stone-500">
          {{ t('nutrition.dailyAverage') }} {{ weeklySummary.dailyAverage[key] }}{{ nutrientUnits[key] }}
        </div>
        <!-- 进度条 -->
        <div
          class="mt-1.5 h-1.5 bg-gray-100 dark:bg-stone-700 rounded-full overflow-hidden"
          role="progressbar"
          :aria-valuenow="percentOf(weeklySummary.dailyAverage[key], recommendedDaily[key])"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`${nutrientLabels[key]}: ${percentOf(weeklySummary.dailyAverage[key], recommendedDaily[key])}% of daily recommended`"
        >
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{
              width: `${Math.min(percentOf(weeklySummary.dailyAverage[key], recommendedDaily[key]), 100)}%`,
              backgroundColor: nutrientColors[key]
            }"
          />
        </div>
        <div class="text-xs text-gray-400 dark:text-stone-500 mt-0.5">
          {{ percentOf(weeklySummary.dailyAverage[key], recommendedDaily[key]) }}% {{ t('nutrition.dailyRecommended') }}
        </div>
      </div>
    </div>
  </div>
</template>
