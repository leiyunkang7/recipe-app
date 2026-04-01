<script setup lang="ts">
/**
 * NutritionStats - 营养素摄入统计组件
 *
 * 功能：
 * - 周视图柱状图（SVG）
 * - 营养素雷达图（SVG）
 * - 日/周切换
 * - 推荐摄入量对比
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

// 周视图柱状图配置
const BAR_CHART = {
  width: 320,
  height: 180,
  paddingLeft: 40,
  paddingRight: 16,
  paddingTop: 16,
  paddingBottom: 32,
}

const nutrients = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const
const nutrientLabels: Record<string, string> = {
  calories: '热量',
  protein: '蛋白质',
  carbs: '碳水',
  fat: '脂肪',
  fiber: '膳食纤维',
}
const nutrientUnits: Record<string, string> = {
  calories: 'kcal',
  protein: 'g',
  carbs: 'g',
  fat: 'g',
  fiber: 'g',
}

const nutrientColors: Record<string, string> = {
  calories: '#f97316',
  protein: '#ef4444',
  carbs: '#3b82f6',
  fat: '#eab308',
  fiber: '#22c55e',
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

const barChartData = computed(() => {
  const days = props.weeklySummary.daily
  const innerW = BAR_CHART.width - BAR_CHART.paddingLeft - BAR_CHART.paddingRight
  const innerH = BAR_CHART.height - BAR_CHART.paddingTop - BAR_CHART.paddingBottom
  const barWidth = (innerW / days.length) * 0.6
  const gap = (innerW / days.length) * 0.4

  return days.map((d, i) => {
    const value = d[activeNutrient.value as keyof DailyNutrition] as number
    const maxVal = maxValues.value[activeNutrient.value]
    const barHeight = maxVal > 0 ? (value / maxVal) * innerH : 0
    const x = BAR_CHART.paddingLeft + i * (barWidth + gap) + gap / 2
    const y = BAR_CHART.paddingTop + innerH - barHeight
    const recHeight = maxVal > 0 ? (props.recommendedDaily[activeNutrient.value] / maxVal) * innerH : 0
    const recY = BAR_CHART.paddingTop + innerH - recHeight
    const dayLabel = d.date.slice(5) // MM-DD
    return { x, y, barWidth, barHeight, value, dayLabel, recY, recHeight }
  })
})

// 雷达图配置
const RADAR_CHART = {
  cx: 120,
  cy: 120,
  radius: 90,
  levels: 4,
}

const radarPoints = computed(() => {
  const { dailyAverage, recommendedDaily: rec } = props
  const labels = nutrients
  const values = nutrients.map(k => {
    const avg = dailyAverage[k]
    const recommended = rec[k]
    return recommended > 0 ? Math.min(avg / recommended, 1.5) : 0
  })

  // 生成5个顶点的坐标
  return labels.map((_, i) => {
    const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2
    return values.map(v => ({
      x: RADAR_CHART.cx + Math.cos(angle) * RADAR_CHART.radius * v,
      y: RADAR_CHART.cy + Math.sin(angle) * RADAR_CHART.radius * v,
    }))
  })
})

const radarPolygonPoints = computed(() => {
  const { dailyAverage, recommendedDaily: rec } = props
  const values = nutrients.map(k => {
    const avg = dailyAverage[k]
    const recommended = rec[k]
    return recommended > 0 ? Math.min(avg / recommended, 1.5) : 0
  })
  return values.map((v, i) => {
    const angle = (Math.PI * 2 * i) / nutrients.length - Math.PI / 2
    return `${RADAR_CHART.cx + Math.cos(angle) * RADAR_CHART.radius * v},${RADAR_CHART.cy + Math.sin(angle) * RADAR_CHART.radius * v}`
  }).join(' ')
})

const radarLabels = computed(() => {
  return nutrients.map((k, i) => {
    const angle = (Math.PI * 2 * i) / nutrients.length - Math.PI / 2
    const labelR = RADAR_CHART.radius + 20
    return {
      x: RADAR_CHART.cx + Math.cos(angle) * labelR,
      y: RADAR_CHART.cy + Math.sin(angle) * labelR,
      label: nutrientLabels[k],
      value: dailyAverage[k],
      unit: nutrientUnits[k],
      color: nutrientColors[k],
    }
  })
})

const radarGridLevels = computed(() => {
  return Array.from({ length: RADAR_CHART.levels }, (_, i) => ({
    radius: (RADAR_CHART.radius / RADAR_CHART.levels) * (i + 1),
    ratio: ((i + 1) / RADAR_CHART.levels * 100).toFixed(0) + '%',
  }))
})

// 百分比计算
const percentOf = (value: number, recommended: number) => {
  return recommended > 0 ? Math.round((value / recommended) * 100) : 0
}

// 周几标签
const weekDayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const getWeekDay = (dateStr: string) => {
  const d = new Date(dateStr)
  return weekDayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

const isToday = (dateStr: string) => dateStr === new Date().toISOString().split('T')[0]
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
            : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'
        ]"
        :style="activeNutrient === key ? { backgroundColor: nutrientColors[key] } : {}"
        @click="activeNutrient = key"
      >
        {{ nutrientLabels[key] }}
      </button>
    </div>

    <!-- 柱状图 (SVG) -->
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
            v-if="isToday(weeklySummary.daily[i].date)"
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
            :fill="isToday(weeklySummary.daily[i].date) ? '#f97316' : '#9ca3af'"
            :font-weight="isToday(weeklySummary.daily[i].date) ? 'bold' : 'normal'"
          >
            {{ getWeekDay(weeklySummary.daily[i].date) }}
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

    <!-- 雷达图 -->
    <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-stone-200 mb-3">
        本周平均 vs 推荐摄入
      </h3>
      <svg :viewBox="`0 0 240 200`" class="w-full max-w-xs mx-auto">
        <!-- 网格圆 -->
        <template v-for="(level, i) in radarGridLevels" :key="`level-${i}`">
          <circle
            :cx="RADAR_CHART.cx"
            :cy="RADAR_CHART.cy"
            :r="level.radius"
            fill="none"
            stroke="#e5e7eb"
            stroke-width="1"
          />
        </template>

        <!-- 轴线 -->
        <template v-for="(_, i) in nutrients" :key="`axis-${i}`">
          <line
            :x1="RADAR_CHART.cx"
            :y1="RADAR_CHART.cy"
            :x2="RADAR_CHART.cx + Math.cos((Math.PI * 2 * i) / nutrients.length - Math.PI / 2) * RADAR_CHART.radius"
            :y2="RADAR_CHART.cy + Math.sin((Math.PI * 2 * i) / nutrients.length - Math.PI / 2) * RADAR_CHART.radius"
            stroke="#e5e7eb"
            stroke-width="1"
          />
        </template>

        <!-- 推荐值外圈 -->
        <circle
          :cx="RADAR_CHART.cx"
          :cy="RADAR_CHART.cy"
          :r="RADAR_CHART.radius"
          fill="none"
          stroke="#f97316"
          stroke-width="2"
          stroke-dasharray="6,3"
          opacity="0.5"
        />

        <!-- 数据多边形 -->
        <polygon
          :points="radarPolygonPoints"
          :fill="nutrientColors.calories"
          fill-opacity="0.2"
          :stroke="nutrientColors.calories"
          stroke-width="2"
        />

        <!-- 数据点 -->
        <template v-for="(pts, i) in radarPoints" :key="`pts-${i}`">
          <circle
            v-for="(pt, j) in pts"
            :key="`pt-${j}`"
            :cx="pt.x"
            :cy="pt.y"
            r="4"
            :fill="nutrientColors[nutrients[j]]"
          />
        </template>

        <!-- 标签 -->
        <template v-for="lbl in radarLabels" :key="lbl.label">
          <text
            :x="lbl.x"
            :y="lbl.y"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="11"
            :fill="lbl.color"
            font-weight="600"
          >
            {{ lbl.label }}
          </text>
          <text
            :x="lbl.x"
            :y="lbl.y + 14"
            text-anchor="middle"
            font-size="9"
            fill="#9ca3af"
          >
            {{ lbl.value }}{{ lbl.unit }}
          </text>
        </template>
      </svg>
    </div>

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
          <span class="text-xs text-gray-500 dark:text-stone-400">
            {{ nutrientLabels[key] }}
          </span>
        </div>
        <div class="text-lg font-bold text-gray-800 dark:text-stone-100">
          {{ weeklySummary.weeklyTotals[key] }}{{ nutrientUnits[key] }}
        </div>
        <div class="text-xs text-gray-400 dark:text-stone-500">
          日均 {{ weeklySummary.dailyAverage[key] }}{{ nutrientUnits[key] }}
        </div>
        <!-- 进度条 -->
        <div class="mt-1.5 h-1.5 bg-gray-100 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{
              width: `${Math.min(percentOf(weeklySummary.dailyAverage[key], recommendedDaily[key]), 100)}%`,
              backgroundColor: nutrientColors[key]
            }"
          />
        </div>
        <div class="text-xs text-gray-400 dark:text-stone-500 mt-0.5">
          {{ percentOf(weeklySummary.dailyAverage[key], recommendedDaily[key]) }}% 日推荐
        </div>
      </div>
    </div>
  </div>
</template>
