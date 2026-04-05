<script setup lang="ts">
/**
 * NutritionBarChart - 营养素柱状图组件
 *
 * 功能：
 * - 周视图柱状图（SVG）
 * - 支持营养素切换
 * - 推荐摄入参考线
 * - 今日高亮显示
 */
import type { DailyNutrition } from '~/composables/useNutritionStats'

interface Props {
  daily: DailyNutrition[]
  activeNutrient: string
  recommendedDaily: Record<string, number>
  maxValues: Record<string, number>
  nutrientColors: Record<string, string>
  nutrientLabels: Record<string, string>
}

const props = defineProps<Props>()

const BAR_CHART = {
  width: 320,
  height: 180,
  paddingLeft: 40,
  paddingRight: 16,
  paddingTop: 16,
  paddingBottom: 32,
}

const weekDayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const getWeekDay = (dateStr: string) => {
  const d = new Date(dateStr)
  return weekDayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

const isToday = (dateStr: string) => dateStr === new Date().toISOString().split('T')[0]

const barChartData = computed(() => {
  const days = props.daily
  const innerW = BAR_CHART.width - BAR_CHART.paddingLeft - BAR_CHART.paddingRight
  const innerH = BAR_CHART.height - BAR_CHART.paddingTop - BAR_CHART.paddingBottom
  const barWidth = (innerW / days.length) * 0.6
  const gap = (innerW / days.length) * 0.4

  return days.map((d, i) => {
    const value = d[props.activeNutrient as keyof DailyNutrition] as number
    const maxVal = props.maxValues[props.activeNutrient]!
    const barHeight = maxVal > 0 ? (value / maxVal) * innerH : 0
    const x = BAR_CHART.paddingLeft + i * (barWidth + gap) + gap / 2
    const y = BAR_CHART.paddingTop + innerH - barHeight
    const recHeight = maxVal > 0 ? (props.recommendedDaily[props.activeNutrient]! / maxVal) * innerH : 0
    const recY = BAR_CHART.paddingTop + innerH - recHeight
    return { x, y, barWidth, barHeight, value, dayLabel: getWeekDay(d.date), recY, recHeight }
  })
})
</script>

<template>
  <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-stone-200">
        本周 {{ nutrientLabels[activeNutrient] }} 摄入
      </h3>
      <span class="text-xs text-gray-400 dark:text-stone-500">
        橙色线 = 推荐摄入
      </span>
    </div>

    <svg :viewBox="`0 0 ${BAR_CHART.width} ${BAR_CHART.height}`" class="w-full">
      <!-- 网格线 -->
      <template v-for="i in 4" :key="`grid-${i}`">
        <line
          :x1="BAR_CHART.paddingLeft"
          :y1="BAR_CHART.paddingTop + (BAR_CHART.height - BAR_CHART.paddingTop - BAR_CHART.paddingBottom) * (i / 4)"
          :x2="BAR_CHART.width - BAR_CHART.paddingRight"
          :y2="BAR_CHART.paddingTop + (BAR_CHART.height - BAR_CHART.paddingTop - BAR_CHART.paddingBottom) * (i / 4)"
          stroke="#e5e7eb"
          stroke-width="1"
          stroke-dasharray="4,4"
        />
      </template>

      <!-- 推荐摄入参考线 -->
      <template v-for="(bar, i) in barChartData" :key="`rec-${i}`">
        <line
          :x1="bar.x - 2"
          :y1="bar.recY"
          :x2="bar.x + bar.barWidth + 2"
          :y2="bar.recY"
          stroke="#f97316"
          stroke-width="2"
          stroke-dasharray="4,2"
          opacity="0.7"
        />
      </template>

      <!-- 柱子 -->
      <template v-for="(bar, i) in barChartData" :key="`bar-${i}`">
        <rect
          :x="bar.x"
          :y="bar.y"
          :width="bar.barWidth"
          :height="bar.barHeight"
          :fill="nutrientColors[activeNutrient]"
          rx="4"
          opacity="0.85"
        />
        <!-- 今日高亮边框 -->
        <rect
          v-if="daily[i] && isToday(daily[i]!.date)"
          :x="bar.x"
          :y="bar.y"
          :width="bar.barWidth"
          :height="bar.barHeight"
          fill="none"
          stroke="#f97316"
          stroke-width="2"
          rx="4"
        />
        <!-- 日期标签 -->
        <text
          :x="bar.x + bar.barWidth / 2"
          :y="BAR_CHART.height - 6"
          text-anchor="middle"
          font-size="10"
          :fill="daily[i] && isToday(daily[i]!.date) ? '#f97316' : '#9ca3af'"
          :font-weight="daily[i] && isToday(daily[i]!.date) ? 'bold' : 'normal'"
        >
          {{ bar.dayLabel }}
        </text>
        <!-- 数值标签 -->
        <text
          v-if="bar.value > 0"
          :x="bar.x + bar.barWidth / 2"
          :y="bar.y - 4"
          text-anchor="middle"
          font-size="9"
          :fill="nutrientColors[activeNutrient]"
          font-weight="600"
        >
          {{ bar.value }}
        </text>
      </template>
    </svg>
  </div>
</template>
