<script setup lang="ts">
/**
 * Profile - 个人中心页面
 *
 * 功能：
 * - 营养统计入口
 * - 今日饮食记录
 * - 本周营养素汇总
 */

const { t } = useI18n()
const localePath = useLocalePath()

const {
  loading,
  selectedDate,
  viewMode,
  weeklySummary,
  todayNutrition,
  dailyRecipes,
  loadNutritionData,
  toggleEaten,
  isEaten,
  recommendedDaily,
  getToday,
} = useNutritionStats()

useSeoMeta({
  title: () => `${t('profile.title')} - ${t('app.title')}`,
  description: () => t('profile.description'),
})

const showDatePicker = ref(false)

const dateDisplay = computed(() => {
  const today = getToday()
  if (selectedDate.value === today) return '今天'
  const d = new Date(selectedDate.value)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const dates = computed(() => {
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const isToday = dateStr === getToday()
    result.push({
      value: dateStr,
      label: isToday ? '今天' : `${d.getMonth() + 1}/${d.getDate()}`,
      shortLabel: isToday ? '今' : ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
    })
  }
  return result
})

const handleDateChange = (dateStr: string) => {
  selectedDate.value = dateStr
  showDatePicker.value = false
}

const eatenCount = computed(() => {
  return dailyRecipes.value.filter(r => isEaten(r.id)).length
})

const totalNutritionDisplay = computed(() => {
  return todayNutrition.value
})

// Extract nutrient labels to computed to avoid recreating object on each render
const nutrientLabels = computed(() => ({
  calories: '热量',
  protein: '蛋白质',
  carbs: '碳水',
  fat: '脂肪',
  fiber: '纤维',
}))

onMounted(() => {
  loadNutritionData()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300 pb-20">
    <LazyHeaderSection />

    <main class="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <!-- 页面标题 -->
      <div class="text-center py-2">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-stone-100">
          {{ t('profile.title') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-stone-400">
          {{ t('profile.subtitle') }}
        </p>
      </div>

      <!-- 加载状态 -->
      <LoadingSpinner v-if="loading" />

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
                'flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2 transition-all duration-200 min-w-[44px] min-h-[44px] touch-manipulation',
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

          <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <div
              v-for="(label, key) in nutrientLabels"
              :key="key"
              class="text-center p-2"
            >
              <div class="text-sm font-bold text-gray-800 dark:text-stone-100">
                {{ Math.round(totalNutritionDisplay[key] || 0) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-stone-400">
                {{ label }}
              </div>
            </div>
          </div>

          <div class="mt-3 pt-3 border-t border-gray-100 dark:border-stone-700">
            <NuxtLink
              :to="localePath('/profile/nutrition')"
              class="flex items-center justify-between text-sm text-orange-500 hover:text-orange-600 transition-colors"
            >
              <span>{{ t('profile.viewDetailedStats') }}</span>
              <span>→</span>
            </NuxtLink>
          </div>
        </div>

        <!-- 收藏食谱列表（标记已吃） -->
        <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
          <h2 class="text-base font-semibold text-gray-700 dark:text-stone-200 mb-3">
            {{ dateDisplay }} {{ t('profile.myRecipes') }}
          </h2>

          <div v-if="dailyRecipes.length === 0" class="text-center py-8">
            <p class="text-gray-400 dark:text-stone-500 text-sm">
              {{ t('profile.noFavoriteRecipes') }}
            </p>
          </div>

          <div v-else class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="recipe in dailyRecipes"
              :key="recipe.id"
              :class="[
                'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer',
                isEaten(recipe.id)
                  ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                  : 'bg-gray-50 dark:bg-stone-700 hover:bg-gray-100 dark:hover:bg-stone-600'
              ]"
              @click="toggleEaten(recipe.id)"
            >
              <!-- 已吃标记 -->
              <div
                :class="[
                  'w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200',
                  isEaten(recipe.id)
                    ? 'bg-orange-500 text-white'
                    : 'border-2 border-gray-300 dark:border-stone-500'
                ]"
              >
                <span v-if="isEaten(recipe.id)" class="text-xs">✓</span>
              </div>

              <!-- 食谱信息 -->
              <div class="flex-1 min-w-0">
                <p
                  :class="[
                    'text-sm font-medium truncate',
                    isEaten(recipe.id)
                      ? 'text-orange-700 dark:text-orange-300'
                      : 'text-gray-700 dark:text-stone-200'
                  ]"
                >
                  {{ recipe.title }}
                </p>
                <p v-if="recipe.nutritionInfo" class="text-xs text-gray-400 dark:text-stone-500">
                  {{ Math.round(recipe.nutritionInfo.calories || 0) }} kcal
                </p>
              </div>

              <!-- 营养标签 -->
              <div v-if="recipe.nutritionInfo" class="flex-shrink-0 flex gap-1">
                <span
                  v-if="recipe.nutritionInfo.protein"
                  class="min-w-[32px] min-h-[32px] flex items-center justify-center px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-500 text-xs rounded touch-manipulation"
                >
                  P
                </span>
                <span
                  v-if="recipe.nutritionInfo.carbs"
                  class="min-w-[32px] min-h-[32px] flex items-center justify-center px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 text-xs rounded touch-manipulation"
                >
                  C
                </span>
                <span
                  v-if="recipe.nutritionInfo.fat"
                  class="min-w-[32px] min-h-[32px] flex items-center justify-center px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 text-xs rounded touch-manipulation"
                >
                  F
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
