<script setup lang="ts">
/**
 * ProfileStats - 营养统计数据和日期选择
 */
const { t } = useI18n()

const props = defineProps<{
  loading: boolean
  selectedDate: string
  dates: Array<{
    value: string
    label: string
    shortLabel: string
  }>
  totalNutritionDisplay: Record<string, number>
  eatenCount: number
}>()

const emit = defineEmits<{
  dateChange: [dateStr: string]
}>()

const getToday = () => new Date().toISOString().split('T')[0]

const dateDisplay = computed(() => {
  const today = getToday()
  if (props.selectedDate === today) return '今天'
  const d = new Date(props.selectedDate)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const handleDateChange = (dateStr: string) => {
  emit('dateChange', dateStr)
}
</script>

<template>
  <template v-if="loading">
    <LoadingSpinner />
  </template>

  <template v-else>
    <!-- 日期选择器 -->
    <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-gray-700 dark:text-stone-200">
          {{ t('profile.dateSelector') }}
        </h2>
      </div>
      <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          v-for="d in dates"
          :key="d.value"
          :class="[
            'flex-shrink-0 flex flex-col items-center rounded-xl px-3 py-2 transition-all duration-200 min-w-[44px]',
            selectedDate === d.value
              ? 'bg-orange-500 text-white shadow-md scale-105'
              : 'bg-gray-50 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-600'
          ]"
          @click="handleDateChange(d.value)"
        >
          <span class="text-xs font-medium">{{ d.shortLabel }}</span>
          <span class="text-xs mt-0.5">{{ d.label.split('/').pop() }}</span>
        </button>
      </div>
    </div>

    <!-- 今日营养摄入概览 -->
    <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-gray-700 dark:text-stone-200">
          {{ dateDisplay }} {{ t('profile.nutritionOverview') }}
        </h2>
        <span class="text-sm text-orange-500 font-medium">
          {{ eatenCount }} {{ t('profile.recipesEaten') }}
        </span>
      </div>

      <div class="grid grid-cols-5 gap-2">
        <div
          v-for="(nutrient, key) in { calories: '热量', protein: '蛋白质', carbs: '碳水', fat: '脂肪', fiber: '纤维' }"
          :key="key"
          class="text-center"
        >
          <div class="text-sm font-bold text-gray-800 dark:text-stone-100">
            {{ Math.round(totalNutritionDisplay[key] || 0) }}
          </div>
          <div class="text-xs text-gray-500 dark:text-stone-400">
            {{ nutrient }}
          </div>
        </div>
      </div>

      <div class="mt-3 pt-3 border-t border-gray-100 dark:border-stone-700">
        <NuxtLink
          to="/profile/nutrition"
          class="flex items-center justify-between text-sm text-orange-500 hover:text-orange-600 transition-colors"
        >
          <span>{{ t('profile.viewDetailedStats') }}</span>
          <span>→</span>
        </NuxtLink>
      </div>
    </div>
  </template>
</template>
