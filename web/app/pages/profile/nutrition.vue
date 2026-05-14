<script setup lang="ts">
/**
 * Nutrition - 营养统计详情页
 */

const { t } = useI18n()

const {
  loading,
  weeklySummary,
  recommendedDaily,
  viewMode,
  dailyRecipes,
  loadNutritionData,
  toggleEaten,
  isEaten,
} = useNutritionStats()

useSeoMeta({
  title: () => `${t('profile.nutritionStats')} - ${t('app.title')}`,
  description: () => t('profile.nutritionStatsDescription'),
})

onMounted(() => {
  loadNutritionData()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300 pb-20">
    <LazyHeaderSection />

    <main class="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <!-- 返回按钮 -->
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/profile"
          class="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 transition-colors"
        >
          <span>←</span>
          <span>{{ t('profile.back') }}</span>
        </NuxtLink>
      </div>

      <!-- 页面标题 -->
      <div class="text-center py-2">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-stone-100">
          {{ t('profile.nutritionStats') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-stone-400">
          {{ t('profile.nutritionStatsDescription') }}
        </p>
      </div>

      <!-- 加载状态 -->
      <LoadingSpinner v-if="loading" />

      <template v-else>
        <!-- 营养素统计图表 -->
        <NutritionStats
          :weekly-summary="weeklySummary"
          :recommended-daily="recommendedDaily"
          :view-mode="viewMode"
        />
      </template>
    </main>
  </div>
</template>
