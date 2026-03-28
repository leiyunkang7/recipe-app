<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer, VirtualItem } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  virtualizer: Virtualizer | null
}>()

// 虚拟项缓存 - 使用 shallowRef 避免深层响应式转换
const virtualItemsCache = shallowRef<VirtualItem[]>([])

// totalSize 的响应式引用 - 只在真正变化时更新
const totalSizeRef = ref(0)

// 上次同步的滚动偏移量 - 用于检测是否真的需要同步
let lastSyncedScrollTop = -1
// 上次同步的 totalSize - 用于检测是否真的需要更新
let lastSyncedTotalSize = 0
// 上次同步的虚拟项数量 - 用于检测是否真的有新项需要渲染
let lastSyncedItemCount = 0
// 上次同步的首尾项索引 - 用于快速检测变化
let lastSyncedFirstIndex = -1
let lastSyncedLastIndex = -1

// 缓存的 items 引用，用于检测虚拟项是否真正变化
let cachedItemsString = ''

// 将 items 数组转换为稳定的字符串表示，用于快速变化检测
const getItemsSignature = (items: VirtualItem[]): string => {
  if (items.length === 0) return '[]'
  // 只取首尾索引和数量，组合成签名
  const first = items[0]
  const last = items[items.length - 1]
  return `${first.index}:${last.index}:${items.length}`
}

// 同步虚拟滚动器状态 - 父组件 RAF 调度，直接执行同步
// 核心优化：
// 1. 不在子组件发起 RAF，由父组件统一调度
// 2. 只在 totalSize 变化时更新响应式状态
// 3. 只在虚拟项真正变化时才更新 virtualItemsCache（避免不必要的重渲染）
// 4. 使用首尾索引比较替代 O(n) 的 key 数组比较
// 5. 优化：使用字符串签名快速检测变化，避免深层比较
const syncVirtualizer = (scrollTop: number) => {
  if (!props.virtualizer) return

  // 滚动位置变化未超过阈值，跳过同步
  const scrollDelta = Math.abs(scrollTop - lastSyncedScrollTop)
  if (scrollDelta < 4 && lastSyncedScrollTop >= 0) return
  lastSyncedScrollTop = scrollTop

  const items = props.virtualizer.getVirtualItems()
  const newTotalSize = props.virtualizer.getTotalSize()
  const currentItemCount = items.length

  // 使用字符串签名快速检测变化（避免 O(n) 数组比较）
  const newSignature = getItemsSignature(items)
  const signatureChanged = newSignature !== cachedItemsString

  // 快速变化检测：比较首尾索引和数量
  const firstIndex = items.length > 0 ? items[0].index : -1
  const lastIndex = items.length > 0 ? items[items.length - 1].index : -1
  const itemsChanged = signatureChanged || currentItemCount !== lastSyncedItemCount
    || firstIndex !== lastSyncedFirstIndex
    || lastIndex !== lastSyncedLastIndex

  // 只有在 totalSize 变化、项数量变化或项内容变化时才调用 update()
  if (newTotalSize !== lastSyncedTotalSize || itemsChanged) {
    props.virtualizer.update()
    lastSyncedTotalSize = newTotalSize
    lastSyncedItemCount = currentItemCount
    lastSyncedFirstIndex = firstIndex
    lastSyncedLastIndex = lastIndex

    // 只有在虚拟项真正变化时才更新缓存（避免触发 Vue 重渲染）
    if (itemsChanged) {
      cachedItemsString = newSignature
      virtualItemsCache.value = items
    }
  }

  // 只在 totalSize 变化时更新响应式状态
  if (newTotalSize !== lastSyncedTotalSize) {
    totalSizeRef.value = newTotalSize
  }
}

// 监听 virtualizer 变化
watch(() => props.virtualizer, (virtualizer) => {
  if (virtualizer) {
    lastSyncedTotalSize = 0
    lastSyncedScrollTop = -1
    lastSyncedItemCount = 0
    lastSyncedFirstIndex = -1
    lastSyncedLastIndex = -1
    cachedItemsString = ''
  } else {
    virtualItemsCache.value = []
    totalSizeRef.value = 0
    lastSyncedTotalSize = 0
    lastSyncedScrollTop = -1
    lastSyncedItemCount = 0
    lastSyncedFirstIndex = -1
    lastSyncedLastIndex = -1
    cachedItemsString = ''
  }
}, { immediate: true })

// 暴露同步方法给父组件（父组件负责滚动监听和 RAF 调度）
defineExpose({ syncVirtualizer })
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
    <div
      :style="{
        height: `${totalSizeRef.value}px`,
        width: '100%',
        position: 'relative',
        contain: 'content',
      }"
    >
      <template v-for="virtualRow in virtualItemsCache" :key="virtualRow.key">
        <div
          v-memo="[recipes[virtualRow.index]?.id]"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
            contain: 'content',
            willChange: 'transform',
          }"
        >
          <LazyRecipeCard
            :recipe="recipes[virtualRow.index]"
            :enter-delay="0"
            disable-animation
          />
        </div>
      </template>
    </div>
  </div>
</template>
