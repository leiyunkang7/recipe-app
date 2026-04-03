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

const {
  loading,
  selectedDate,
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
}

const eatenCount = computed(() => {
  return dailyRecipes.value.filter(r => isEaten(r.id)).length
})

onMounted(() => {
  loadNutritionData()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300 pb-20">
    <LazyHeaderSection />

    <main class="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <ProfileHeader />

      <ProfileStats
        :loading="loading"
        :selected-date="selectedDate"
        :dates="dates"
        :total-nutrition-display="todayNutrition"
        :eaten-count="eatenCount"
        @date-change="handleDateChange"
      />

      <template v-if="!loading">
        <ProfileRecipeGrid
          :selected-date="selectedDate"
          :daily-recipes="dailyRecipes"
          :is-eaten="isEaten"
          @toggle-eaten="toggleEaten"
        />
      </template>
    </main>
  </div>
</template>
