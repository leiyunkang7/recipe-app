<script setup lang="ts">
import type { Recipe } from '~/types'

const { t } = useI18n()

const props = defineProps<{
  recipes: Recipe[]
  useVirtualScrolling: boolean
}>()

const scrollContainerRef = ref<HTMLElement | null>(null)

// Virtualizer type definition - captures the subset of methods we use
interface Virtualizer {
  getTotalSize: () => number
  getVirtualItems: () => Array<{ key: string | number; size: number; start: number; index: number }>
  setOptions: (options: { count: number }) => void
  unmount: () => void
}

// Dynamic import for virtual scrolling - only loaded when needed (100+ items)
const leftVirtualizer = ref<Virtualizer | null>(null)
const rightVirtualizer = ref<Virtualizer | null>(null)

// Cache virtual items to avoid calling getVirtualItems() on every render
// getVirtualItems() creates a new array each time it's called
const leftVirtualItems = computed(() => leftVirtualizer.value?.getVirtualItems() ?? [])
const rightVirtualItems = computed(() => rightVirtualizer.value?.getVirtualItems() ?? [])
const leftTotalSize = computed(() => leftVirtualizer.value?.getTotalSize() ?? 0)
const rightTotalSize = computed(() => rightVirtualizer.value?.getTotalSize() ?? 0)

const COLUMN_GAP = 16
const CARD_HEIGHT = 280

// 双列布局 - 单次遍历同时计算两列索引，避免重复过滤
// 直接计算左右列，避免中间对象创建
const leftColumnRecipes = computed(() => {
  const left: typeof props.recipes = []
  for (let i = 0; i < props.recipes.length; i += 2) {
    left.push(props.recipes[i])
  }
  return left
})

const rightColumnRecipes = computed(() => {
  const right: typeof props.recipes = []
  for (let i = 1; i < props.recipes.length; i += 2) {
    right.push(props.recipes[i])
  }
  return right
})

// 动态高度测量
const measureElement = (el: HTMLElement | null) => {
  if (!el) return 0
  return el.getBoundingClientRect().height + COLUMN_GAP
}

const initVirtualizers = async () => {
  if (!scrollContainerRef.value) return

  // Dynamic import @tanstack/vue-virtual only when virtual scrolling is enabled
  const { useVirtualizer } = await import('@tanstack/vue-virtual')

  leftVirtualizer.value = useVirtualizer({
    count: leftColumnRecipes.value.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => CARD_HEIGHT + COLUMN_GAP,
    measureElement,
    overscan: 3,
  })

  rightVirtualizer.value = useVirtualizer({
    count: rightColumnRecipes.value.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => CARD_HEIGHT + COLUMN_GAP,
    measureElement,
    overscan: 3,
  })
}

watch([leftColumnRecipes, rightColumnRecipes], () => {
  if (!props.useVirtualScrolling || !scrollContainerRef.value) return

  if (!leftVirtualizer.value || !rightVirtualizer.value) {
    initVirtualizers()
    return
  }

  leftVirtualizer.value.setOptions({ count: leftColumnRecipes.value.length })
  rightVirtualizer.value.setOptions({ count: rightColumnRecipes.value.length })
})

watch(() => props.useVirtualScrolling, (useVirtual) => {
  if (useVirtual && scrollContainerRef.value && !leftVirtualizer.value) {
    initVirtualizers()
  }
})

onMounted(() => {
  if (props.useVirtualScrolling) {
    initVirtualizers()
  }
})

onUnmounted(() => {
  if (leftVirtualizer.value) {
    leftVirtualizer.value.unmount()
    leftVirtualizer.value = null
  }
  if (rightVirtualizer.value) {
    rightVirtualizer.value.unmount()
    rightVirtualizer.value = null
  }
})
</script>

<template>
  <!-- 虚拟滚动模式 -->
  <div v-if="useVirtualScrolling && leftVirtualizer && rightVirtualizer" ref="scrollContainerRef" class="flex gap-4 md:gap-5 h-[calc(100vh-200px)] overflow-auto">
    <!-- 左列 -->
    <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
      <div
        :style="{
          height: `${leftTotalSize}px`,
          width: '100%',
          position: 'relative',
        }"
      >
        <div
          v-for="virtualRow in leftVirtualItems"
          :key="virtualRow.key"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }"
        >
          <LazyRecipeCard
            :recipe="leftColumnRecipes[virtualRow.index]"
            :enter-delay="0"
          />
        </div>
      </div>
    </div>

    <!-- 右列 -->
    <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
      <div
        :style="{
          height: `${rightTotalSize}px`,
          width: '100%',
          position: 'relative',
        }"
      >
        <div
          v-for="virtualRow in rightVirtualItems"
          :key="virtualRow.key"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }"
        >
          <LazyRecipeCard
            :recipe="rightColumnRecipes[virtualRow.index]"
            :enter-delay="0"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- 标准模式 -->
  <div v-else class="flex gap-4 md:gap-5">
    <div class="flex-1 flex flex-col gap-4 md:gap-5">
      <LazyRecipeCard
        v-for="(recipe, index) in leftColumnRecipes"
        v-memo="[recipe.id, recipe.title, recipe.prepTimeMinutes, recipe.cookTimeMinutes, recipe.servings]"
        :key="recipe.id"
        :recipe="recipe"
        :enter-delay="index * 50"
      />
    </div>
    <div class="flex-1 flex flex-col gap-4 md:gap-5">
      <LazyRecipeCard
        v-for="(recipe, index) in rightColumnRecipes"
        v-memo="[recipe.id, recipe.title, recipe.prepTimeMinutes, recipe.cookTimeMinutes, recipe.servings]"
        :key="recipe.id"
        :recipe="recipe"
        :enter-delay="(index + leftColumnRecipes.length) * 50"
      />
    </div>
  </div>
</template>
