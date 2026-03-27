<script setup lang="ts">
/**
 * RecipeLoadMoreTrigger - 加载更多触发器组件
 *
 * 功能：
 * - 显示加载中状态 (旋转图标)
 * - 显示"没有更多数据"状态
 * - 用于无限滚动场景
 *
 * 使用方式：
 * <RecipeLoadMoreTrigger :has-more="true" :loading-more="false" />
 */
const { t } = useI18n()

defineProps<{
  hasMore: boolean
  loadingMore: boolean
}>()
</script>

<template>
  <div class="flex justify-center py-8">
    <!-- 加载更多状态 -->
    <div v-if="hasMore && loadingMore" class="flex items-center gap-2 text-gray-500 dark:text-stone-400">
      <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm">{{ t('common.loading') }}...</span>
    </div>
    <!-- 没有更多数据 -->
    <div v-else-if="!hasMore" class="text-center text-sm text-gray-400 dark:text-stone-500">
      {{ t('common.noMoreData') }}
    </div>
  </div>
</template>
