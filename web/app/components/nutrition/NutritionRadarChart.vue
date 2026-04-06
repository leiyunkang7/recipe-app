<script setup lang="ts">
/**
 * NutritionRadarChart - 营养素雷达图组件
 *
 * 功能：
 * - 本周平均 vs 推荐摄入对比
 * - SVG 雷达图可视化
 */
const { t } = useI18n()
interface Props {
  dailyAverage: Record<string, number>
  recommendedDaily: Record<string, number>
  nutrientLabels: Record<string, string>
  nutrientUnits: Record<string, string>
  nutrientColors: Record<string, string>
}

const props = defineProps<Props>()

const RADAR_CHART = {
  cx: 120,
  cy: 120,
  radius: 90,
  levels: 4,
}

const nutrients = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const

const radarPolygonPoints = computed(() => {
  const values = nutrients.map(k => {
    const avg = props.dailyAverage[k]!
    const recommended = props.recommendedDaily[k]!
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
      label: props.nutrientLabels[k],
      value: props.dailyAverage[k],
      unit: props.nutrientUnits[k],
      color: props.nutrientColors[k],
    }
  })
})

const radarGridLevels = computed(() => {
  return Array.from({ length: RADAR_CHART.levels }, (_, i) => ({
    radius: (RADAR_CHART.radius / RADAR_CHART.levels) * (i + 1),
  }))
})
</script>

<template>
  <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-stone-200 mb-3">
      {{ t('nutrition.weeklyAverage') }}
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
        fill="#f97316"
        fill-opacity="0.2"
        stroke="#f97316"
        stroke-width="2"
      />

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
</template>
