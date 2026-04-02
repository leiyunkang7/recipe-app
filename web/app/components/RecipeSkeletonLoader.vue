<script setup lang="ts">
/**
 * RecipeSkeletonLoader - 食谱骨架屏加载组件
 *
 * 功能：
 * - 显示骨架屏占位动画
 * - 闪烁动画效果 (shimmer)
 * - 支持自定义骨架项数量
 * - 响应式网格布局
 * - 支持减少动画偏好设置
 *
 * 使用方式：
 * <RecipeSkeletonLoader :count="8" />
 */
const props = withDefaults(defineProps<{
  count?: number
}>(), {
  count: 8
})
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
    <div
      v-for="n in count"
      :key="`skeleton-${n}`"
      class="bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm animate-pulse"
    >
      <div class="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600 relative overflow-hidden">
        <div class="animate-shimmer absolute inset-0"></div>
      </div>
      <div class="p-4 space-y-3">
        <div class="h-4 bg-gray-200 dark:bg-stone-700 rounded-lg w-3/4 relative overflow-hidden">
          <div class="animate-shimmer absolute inset-0"></div>
        </div>
        <div class="h-3 bg-gray-200 dark:bg-stone-700 rounded-lg w-1/2 relative overflow-hidden">
          <div class="animate-shimmer absolute inset-0"></div>
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
