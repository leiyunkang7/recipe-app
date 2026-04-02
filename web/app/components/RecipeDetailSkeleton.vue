<script setup lang="ts">
/**
 * RecipeDetailSkeleton - 食谱详情页骨架屏组件
 *
 * 功能：
 * - 移动端/桌面端响应式骨架屏
 * - Shimmer 闪烁动画
 * - Hero 图片区域骨架
 * - 标题/描述/元信息骨架
 * - 食材/步骤骨架
 * - 支持减少动画偏好设置
 *
 * 使用方式：
 * <RecipeDetailSkeleton />
 */
const { t } = useI18n()
</script>

<template>
  <div class="animate-pulse">
    <!-- Hero 图片骨架 - 移动端 -->
    <div class="lg:hidden relative h-56 sm:h-72 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600 overflow-hidden">
      <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
    </div>

    <!-- Hero 图片骨架 - 桌面端 -->
    <div class="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="rounded-xl h-96 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600 overflow-hidden">
        <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
      </div>
    </div>

    <!-- Mobile 布局骨架 -->
    <div class="lg:hidden px-4 mt-4 space-y-4">
      <!-- 标题卡片骨架 -->
      <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
        <div class="h-6 bg-gray-200 dark:bg-stone-700 rounded-lg w-3/4 mb-3 relative overflow-hidden">
          <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        </div>
        <div class="h-4 bg-gray-200 dark:bg-stone-700 rounded-lg w-1/2 mb-4 relative overflow-hidden">
          <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        </div>
        <!-- 元信息行 -->
        <div class="flex gap-3">
          <div class="h-8 bg-gray-100 dark:bg-stone-700 rounded-full w-20 relative overflow-hidden">
            <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>
          <div class="h-8 bg-gray-100 dark:bg-stone-700 rounded-full w-20 relative overflow-hidden">
            <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>
          <div class="h-8 bg-gray-100 dark:bg-stone-700 rounded-full w-20 relative overflow-hidden">
            <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>
        </div>
      </div>

      <!-- 食材区骨架 -->
      <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
        <div class="h-5 bg-gray-200 dark:bg-stone-700 rounded-lg w-24 mb-4 relative overflow-hidden">
          <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        </div>
        <div v-for="n in 4" :key="`ing-${n}`" class="flex items-center gap-3 mb-3">
          <div class="w-5 h-5 bg-gray-100 dark:bg-stone-700 rounded-full relative overflow-hidden">
            <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>
          <div class="h-4 bg-gray-100 dark:bg-stone-700 rounded w-2/3 relative overflow-hidden">
            <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>
          <div class="h-4 bg-gray-100 dark:bg-stone-700 rounded w-1/4 relative overflow-hidden">
            <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>
        </div>
      </div>

      <!-- 步骤区骨架 -->
      <div class="space-y-4 pb-8">
        <div class="h-5 bg-gray-200 dark:bg-stone-700 rounded-lg w-16 mb-2 relative overflow-hidden">
          <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        </div>
        <div v-for="n in 3" :key="`step-${n}`" class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex-shrink-0 relative overflow-hidden">
              <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-100 dark:bg-stone-700 rounded w-full relative overflow-hidden">
                <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              </div>
              <div class="h-4 bg-gray-100 dark:bg-stone-700 rounded w-4/5 relative overflow-hidden">
                <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop 布局骨架 -->
    <div class="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
          <!-- 开始烹饪按钮骨架 -->
          <div class="h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600 rounded-2xl relative overflow-hidden">
            <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>

          <!-- 标题区骨架 -->
          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm">
            <div class="h-8 bg-gray-200 dark:bg-stone-700 rounded-lg w-3/4 mb-3 relative overflow-hidden">
              <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
            <div class="h-4 bg-gray-100 dark:bg-stone-700 rounded-lg w-1/2 mb-4 relative overflow-hidden">
              <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
            <div class="flex gap-4">
              <div class="h-10 bg-gray-100 dark:bg-stone-700 rounded-full w-28 relative overflow-hidden">
                <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              </div>
              <div class="h-10 bg-gray-100 dark:bg-stone-700 rounded-full w-28 relative overflow-hidden">
                <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              </div>
              <div class="h-10 bg-gray-100 dark:bg-stone-700 rounded-full w-28 relative overflow-hidden">
                <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              </div>
            </div>
          </div>

          <!-- 食材区骨架 -->
          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm">
            <div class="h-5 bg-gray-200 dark:bg-stone-700 rounded-lg w-20 mb-4 relative overflow-hidden">
              <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="n in 6" :key="`d-ing-${n}`" class="flex items-center gap-2">
                <div class="w-4 h-4 bg-gray-100 dark:bg-stone-700 rounded-full relative overflow-hidden">
                  <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                </div>
                <div class="h-4 bg-gray-100 dark:bg-stone-700 rounded w-2/3 relative overflow-hidden">
                  <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 步骤区骨架 -->
          <div class="space-y-4">
            <div class="h-5 bg-gray-200 dark:bg-stone-700 rounded-lg w-16 relative overflow-hidden">
              <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
            <div v-for="n in 4" :key="`d-step-${n}`" class="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex-shrink-0 relative overflow-hidden">
                  <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                </div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-gray-100 dark:bg-stone-700 rounded w-full relative overflow-hidden">
                    <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                  </div>
                  <div class="h-4 bg-gray-100 dark:bg-stone-700 rounded w-5/6 relative overflow-hidden">
                    <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                  </div>
                  <div class="h-4 bg-gray-100 dark:bg-stone-700 rounded w-3/4 relative overflow-hidden">
                    <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar 骨架 -->
        <div class="space-y-4">
          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm">
            <div class="h-5 bg-gray-200 dark:bg-stone-700 rounded-lg w-24 mb-4 relative overflow-hidden">
              <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
            <div v-for="n in 3" :key="`sidebar-${n}`" class="mb-3">
              <div class="h-4 bg-gray-100 dark:bg-stone-700 rounded w-full mb-2 relative overflow-hidden">
                <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              </div>
              <div class="h-3 bg-gray-50 dark:bg-stone-700 rounded w-2/3 relative overflow-hidden">
                <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .animate-pulse {
    animation: none;
  }
}
</style>
