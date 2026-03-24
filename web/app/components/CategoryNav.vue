<script setup lang="ts">
/**
 * CategoryNav - 分类导航组件
 * 
 * 横向滑动分类导航
 * 支持移动端触摸滑动
 * 暗色模式支持
 */

interface Category {
  id: number
  name: string
  displayName: string
}

interface Props {
  categories: Category[]
  selected?: string
}

const props = withDefaults(defineProps<Props>(), {
  selected: ''
})

const emit = defineEmits<{
  select: [category: string]
}>()

const { t } = useI18n()

const scrollRef = ref<HTMLElement | null>(null)

// 提取按钮样式逻辑为函数，避免重复代码
const getButtonClasses = (isSelected: boolean) => {
  const base = 'shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 shadow-sm touch-manipulation active:scale-95 min-h-[44px] flex items-center'
  if (isSelected) {
    return `${base} bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200 dark:shadow-orange-900/30`
  }
  return `${base} bg-white dark:bg-stone-800 text-gray-600 dark:text-stone-300 shadow-gray-200 dark:shadow-stone-700/50 hover:shadow-md dark:hover:shadow-lg`
}

// 滑动滚动
const scroll = (direction: 'left' | 'right') => {
  if (!scrollRef.value) return
  const scrollAmount = 200
  scrollRef.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth'
  })
}
</script>

<template>
  <div class="relative">
    <!-- 左侧滚动按钮 -->
    <button 
      @click="scroll('left')"
      class="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white dark:hover:bg-stone-800 transition-colors md:hidden active:scale-95 touch-manipulation"
      aria-label="滚动左侧"
    >
      <svg class="w-4 h-4 text-gray-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
    </button>

    <!-- 分类滚动容器 -->
    <div 
      ref="scrollRef"
      class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-8 md:px-0"
    >
      <!-- 全部 -->
      <button
        @click="emit('select', '')"
        :class="getButtonClasses(selected === '')"
      >
        {{ t('search.allCategories') }}
      </button>

      <!-- 分类项 -->
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="emit('select', cat.name)"
        :class="getButtonClasses(selected === cat.name)"
      >
        {{ cat.displayName }}
      </button>
    </div>

    <!-- 右侧滚动按钮 -->
    <button 
      @click="scroll('right')"
      class="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white dark:hover:bg-stone-800 transition-colors md:hidden active:scale-95 touch-manipulation"
      aria-label="滚动右侧"
    >
      <svg class="w-4 h-4 text-gray-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
