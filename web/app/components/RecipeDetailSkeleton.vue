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
    <div class="lg:hidden relative h-56 sm:h-72">
      <ShimmerShimmer fill />
    </div>

    <!-- Hero 图片骨架 - 桌面端 -->
    <div class="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="rounded-xl h-96">
        <ShimmerShimmer fill />
      </div>
    </div>

    <!-- Mobile 布局骨架 -->
    <div class="lg:hidden px-4 mt-4 space-y-4">
      <!-- 标题卡片骨架 -->
      <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
        <div class="mb-3">
          <ShimmerShimmer class="w-3/4 h-6 rounded-lg" />
        </div>
        <div class="mb-4">
          <ShimmerShimmer class="w-1/2 h-4 rounded-lg" />
        </div>
        <!-- 元信息行 -->
        <div class="flex gap-3">
          <ShimmerShimmer class="h-8 w-20 rounded-full" />
          <ShimmerShimmer class="h-8 w-20 rounded-full" />
          <ShimmerShimmer class="h-8 w-20 rounded-full" />
        </div>
      </div>

      <!-- 食材区骨架 -->
      <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
        <div class="mb-4">
          <ShimmerShimmer class="w-24 h-5 rounded-lg" />
        </div>
        <div v-for="n in 4" :key="`ing-${n}`" class="flex items-center gap-3 mb-3">
          <ShimmerShimmer class="w-5 h-5 rounded-full" />
          <ShimmerShimmer class="flex-1 h-4 rounded w-2/3" />
          <ShimmerShimmer class="h-4 w-1/4 rounded" />
        </div>
      </div>

      <!-- 步骤区骨架 -->
      <div class="space-y-4 pb-8">
        <div class="mb-2">
          <ShimmerShimmer class="w-16 h-5 rounded-lg" />
        </div>
        <div v-for="n in 3" :key="`step-${n}`" class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
          <div class="flex items-start gap-3">
            <ShimmerShimmer class="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30" />
            <div class="flex-1 space-y-2">
              <ShimmerShimmer class="h-4 w-full rounded" />
              <ShimmerShimmer class="h-4 w-4/5 rounded" />
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
          <div class="h-14 rounded-2xl">
            <ShimmerShimmer fill class="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600" />
          </div>

          <!-- 标题区骨架 -->
          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm">
            <div class="mb-3">
              <ShimmerShimmer class="w-3/4 h-8 rounded-lg" />
            </div>
            <div class="mb-4">
              <ShimmerShimmer class="w-1/2 h-4 rounded-lg" />
            </div>
            <div class="flex gap-4">
              <ShimmerShimmer class="h-10 w-28 rounded-full" />
              <ShimmerShimmer class="h-10 w-28 rounded-full" />
              <ShimmerShimmer class="h-10 w-28 rounded-full" />
            </div>
          </div>

          <!-- 食材区骨架 -->
          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm">
            <div class="mb-4">
              <ShimmerShimmer class="w-20 h-5 rounded-lg" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="n in 6" :key="`d-ing-${n}`" class="flex items-center gap-2">
                <ShimmerShimmer class="w-4 h-4 rounded-full" />
                <ShimmerShimmer class="flex-1 h-4 rounded w-2/3" />
              </div>
            </div>
          </div>

          <!-- 步骤区骨架 -->
          <div class="space-y-4">
            <div>
              <ShimmerShimmer class="w-16 h-5 rounded-lg" />
            </div>
            <div v-for="n in 4" :key="`d-step-${n}`" class="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm">
              <div class="flex items-start gap-4">
                <ShimmerShimmer class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30" />
                <div class="flex-1 space-y-2">
                  <ShimmerShimmer class="h-4 w-full rounded" />
                  <ShimmerShimmer class="h-4 w-5/6 rounded" />
                  <ShimmerShimmer class="h-4 w-3/4 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar 骨架 -->
        <div class="space-y-4">
          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm">
            <div class="mb-4">
              <ShimmerShimmer class="w-24 h-5 rounded-lg" />
            </div>
            <div v-for="n in 3" :key="`sidebar-${n}`" class="mb-3">
              <ShimmerShimmer class="w-full h-4 rounded mb-2" />
              <ShimmerShimmer class="w-2/3 h-3 rounded" />
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
