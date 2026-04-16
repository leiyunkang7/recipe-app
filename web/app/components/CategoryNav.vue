<script setup lang="ts">
/**
 * CategoryNav - 分类导航组件
 *
 * 横向滑动分类导航
 * 支持移动端触摸滑动 + 按钮滑动
 * 入场动画
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

// 入场动画状态
const isEntered = ref(false)
let enterTimer: ReturnType<typeof setTimeout> | null = null

// 滚动按钮显示状态
const showLeftButton = ref(false)
const showRightButton = ref(false)

onMounted(() => {
  enterTimer = setTimeout(() => {
    // Timeout callback checks if component is still mounted by checking if the timer exists
    // If timer was cleared (null), component was unmounted - don't update
    if (enterTimer !== null) {
      isEntered.value = true
    }
  }, 150)

  // 初始检查按钮显示状态
  updateScrollButtons()

  // 使用 passive 监听器提升滚动性能
  if (scrollRef.value) {
    scrollRef.value.addEventListener('scroll', handleScroll, { passive: true })
  }
})

onUnmounted(() => {
  // Clear timer FIRST, then nullify - this prevents callback from executing
  if (enterTimer) {
    clearTimeout(enterTimer)
    enterTimer = null
  }

  if (scrollDebounceTimer) {
    clearTimeout(scrollDebounceTimer)
    scrollDebounceTimer = null
  }

  // 移除 passive 监听器 - 必须传入相同选项才能正确移除
  if (scrollRef.value) {
    scrollRef.value.removeEventListener('scroll', handleScroll, { passive: true })
  }
})

// Pre-compute animation delays once using computed to avoid repeated function calls during renders
const animationDelays = computed(() =>
  props.categories.map((_, index) => `${(index + 1) * 30}ms`)
)

// Debounced scroll button update - avoids excessive reactive updates during fast scrolling
let scrollDebounceTimer: ReturnType<typeof setTimeout> | null = null
const updateScrollButtons = () => {
  if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer)
  scrollDebounceTimer = setTimeout(() => {
    if (!scrollRef.value) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.value
    showLeftButton.value = scrollLeft > 10
    showRightButton.value = scrollLeft < scrollWidth - clientWidth - 10
    scrollDebounceTimer = null
  }, 16) // ~1 frame at 60fps
}

// 监听滚动事件更新按钮状态
const handleScroll = () => {
  updateScrollButtons()
}

// 预定义按钮样式类 - 避免每次调用时创建新字符串
const BASE_BUTTON_CLASS = 'shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 shadow-sm touch-manipulation active:scale-95 min-h-[44px] flex items-center'
const SELECTED_CLASS = 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200 dark:shadow-orange-900/30'
const UNSELECTED_CLASS = 'bg-white dark:bg-stone-800 text-gray-600 dark:text-stone-300 shadow-gray-200 dark:shadow-stone-700/50 hover:shadow-md dark:hover:shadow-lg'

// Pre-computed button classes - static constants since only 2 possible states
const SELECTED_CLASSES = `${BASE_BUTTON_CLASS} ${SELECTED_CLASS}`
const UNSELECTED_CLASSES = `${BASE_BUTTON_CLASS} ${UNSELECTED_CLASS}`

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
      class="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white dark:hover:bg-stone-800 transition-all md:hidden active:scale-95 touch-manipulation"
      :class="isEntered && showLeftButton ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-4 pointer-events-none'"
      :aria-label="t('aria.scrollLeft')"
    >
      <svg class="w-4 h-4 text-gray-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
    </button>

    <!-- 分类滚动容器 -->
    <div
      ref="scrollRef"
      class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-0 touch-manipulation"
      role="tablist"
      aria-label="Recipe categories"
    >
      <!-- 全部 -->
      <button
        @click="emit('select', '')"
        :style="isEntered ? { animationDelay: '0ms' } : undefined"
        class="transition-all duration-300"
        :class="[
          selected === '' ? SELECTED_CLASSES : UNSELECTED_CLASSES,
          isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        ]"
        role="tab"
        :aria-selected="selected === ''"
      >
        {{ t('search.allCategories') }}
      </button>

      <!-- 分类项 -->
      <button
        v-for="(cat, index) in categories"
        :key="cat.id"
        @click="emit('select', cat.name)"
        :style="isEntered ? { animationDelay: animationDelays[index] } : undefined"
        class="transition-all duration-300"
        :class="[
          selected === cat.name ? SELECTED_CLASSES : UNSELECTED_CLASSES,
          isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        ]"
        role="tab"
        :aria-selected="selected === cat.name"
      >
        {{ cat.displayName }}
      </button>
    </div>

    <!-- 右侧滚动按钮 -->
    <button
      @click="scroll('right')"
      class="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white dark:hover:bg-stone-800 transition-all md:hidden active:scale-95 touch-manipulation"
      :class="isEntered && showRightButton ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'"
      :aria-label="t('aria.scrollRight')"
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
