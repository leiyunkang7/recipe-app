<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  useVirtualScrolling: boolean
}>()

const scrollContainerRef = ref<HTMLElement | null>(null)

// Dynamic import for virtual scrolling - only loaded when needed (100+ items)
const leftVirtualizer = ref<Virtualizer | null>(null)
const rightVirtualizer = ref<Virtualizer | null>(null)

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
    <RecipeGridVirtualColumn
      :recipes="leftColumnRecipes"
      :virtualizer="leftVirtualizer"
      :column-gap="COLUMN_GAP"
    />
    <RecipeGridVirtualColumn
      :recipes="rightColumnRecipes"
      :virtualizer="rightVirtualizer"
      :column-gap="COLUMN_GAP"
    />
  </div>

  <!-- 标准模式 -->
  <div v-else class="flex gap-4 md:gap-5">
    <RecipeGridColumn :recipes="leftColumnRecipes" />
    <RecipeGridColumn :recipes="rightColumnRecipes" :enter-delay-base="leftColumnRecipes.length * 50" />
  </div>
</template>
