<script setup lang="ts">
/**
 * HeaderSection - 页面顶部 Header 区域组件
 *
 * 功能：
 * - 响应式布局 (移动端/桌面端)
 * - Logo 和标题展示
 * - 搜索框集成
 * - 主题切换按钮
 * - 渐变背景 + 动态光效
 * - 入场动画
 *
 * 使用方式：
 * <HeaderSection v-model:search-query="query" @search="handleSearch" />
 */
const { t } = useI18n()

const selectedCategory = defineModel<string>('selectedCategory', { default: '' })
const categories = defineModel<Array<{ id: number; name: string; displayName: string }>>('categories', { default: [] })

// Use centralized breakpoint composable
const { isMobile } = useBreakpoint()
</script>

<template>
  <!-- 移动端分类筛选 -->
  <section v-if="isMobile" class="md:hidden px-4 py-4 -mt-2">
    <CategoryNav
      :categories="categories"
      :selected="selectedCategory"
      @select="selectedCategory = $event"
    />
  </section>

  <!-- 桌面端分类筛选 -->
  <section v-else class="hidden md:block px-4 py-3 -mt-2 bg-white/50 dark:bg-stone-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-stone-700">
    <div class="max-w-7xl mx-auto">
      <CategoryNav
        :categories="categories"
        :selected="selectedCategory"
        @select="selectedCategory = $event"
      />
    </div>
  </section>
</template>
