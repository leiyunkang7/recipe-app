<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer, VirtualItem } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  virtualizer: Virtualizer | null
  /** 列索引，用于延迟同步优化 */
  columnIndex?: number
}>()

const columnIndex = props.columnIndex ?? 0

// 扩展的虚拟项类型，包含已解析的 recipe
interface VirtualRow extends VirtualItem {
  recipe: Recipe | undefined
}

// 虚拟项缓存 - 使用 shallowRef 避免深层响应式转换
// 使用 Map 缓存已创建的 VirtualRow，按 index 索引避免重复创建
const virtualItemsCacheMap = new Map<number, VirtualRow>()
// 使用 shallowRef 但通过 in-place 变更（splice）避免数组引用变化触发不必要的响应
const virtualItemsCache = shallowRef<VirtualRow[]>([])

// totalSize 的响应式引用
const totalSizeRef = ref(0)

// 上次同步的滚动偏移量
let lastSyncedScrollTop = -1
let lastSyncedTotalSize = 0
let lastSyncedItemCount = 0
let lastSyncedFirstIndex = -1
let lastSyncedLastIndex = -1

// 同步虚拟滚动器状态
// 优化：
// 1. 双列延迟同步：奇数列延迟半帧，减少同步次数
// 2. 只在 totalSize 变化时更新响应式状态
// 3. visibility 替代 display:none，减少 reflow
const syncVirtualizer = (scrollTop: number) => {
  if (!props.virtualizer) return

  // 双列延迟同步：偶数列延迟执行，减少同步次数
  if (columnIndex % 2 === 1) {
    requestAnimationFrame(() => syncVirtualizerImmediate(scrollTop))
    return
  }
  syncVirtualizerImmediate(scrollTop)
}

const syncVirtualizerImmediate = (scrollTop: number) => {
  if (!props.virtualizer) return

  // 滚动位置变化未超过阈值，跳过同步
  const scrollDelta = Math.abs(scrollTop - lastSyncedScrollTop)
  if (scrollDelta < 4 && lastSyncedScrollTop >= 0) return
  lastSyncedScrollTop = scrollTop

  props.virtualizer.update()

  const items = props.virtualizer.getVirtualItems()
  const newTotalSize = props.virtualizer.getTotalSize()
  const currentItemCount = items.length

  const firstIndex = items.length > 0 ? items[0].index : -1
  const lastIndex = items.length > 0 ? items[items.length - 1].index : -1
  const itemsChanged = currentItemCount !== lastSyncedItemCount
    || firstIndex !== lastSyncedFirstIndex
    || lastIndex !== lastSyncedLastIndex

  if (newTotalSize !== lastSyncedTotalSize || itemsChanged) {
    lastSyncedTotalSize = newTotalSize
    lastSyncedItemCount = currentItemCount
    lastSyncedFirstIndex = firstIndex
    lastSyncedLastIndex = lastIndex

    if (itemsChanged) {
      // 复用缓存的 VirtualRow 对象，只更新必要的属性
      // 优化：使用 splice in-place 变更数组，避免数组引用变化触发不必要的响应
      const newCache: VirtualRow[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const index = item.index
        let cached = virtualItemsCacheMap.get(index)
        if (cached) {
          // 复用现有对象，只更新 position 和 size
          cached.start = item.start
          cached.size = item.size
          cached.key = item.key
          // recipe 可能已变化，需要更新引用
          cached.recipe = props.recipes[index]
        } else {
          // 创建新对象并缓存
          cached = {
            ...item,
            recipe: props.recipes[index],
          }
          virtualItemsCacheMap.set(index, cached)
        }
        newCache[i] = cached
      }
      // 使用 splice 原地更新，避免触发整个数组的响应式替换
      virtualItemsCache.value.splice(0, virtualItemsCache.value.length, ...newCache)
    }
  }

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
  } else {
    virtualItemsCache.value = []
    virtualItemsCacheMap.clear()
    totalSizeRef.value = 0
    lastSyncedTotalSize = 0
    lastSyncedScrollTop = -1
    lastSyncedItemCount = 0
    lastSyncedFirstIndex = -1
    lastSyncedLastIndex = -1
  }
}, { immediate: true })

defineExpose({ syncVirtualizer })
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
    <div
      :style="{
        height: `${totalSizeRef.value}px`,
        width: '100%',
        position: 'relative',
      }"
    >
      <template v-for="virtualRow in virtualItemsCache" :key="virtualRow.key">
        <div
          v-memo="[virtualRow.key, virtualRow.start, virtualRow.size, virtualRow.recipe?.id]"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
            contain: 'layout',
          }"
        >
          <RecipeCardLazy
            :recipe="virtualRow.recipe"
            :enter-delay="0"
            disable-animation
          />
        </div>
      </template>
    </div>
  </div>
</template>
