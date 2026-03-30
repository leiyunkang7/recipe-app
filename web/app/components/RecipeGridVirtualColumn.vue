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
// 使用 shallowRef 但通过 in-place 变更（索引赋值）避免数组引用变化触发不必要的响应
// 注意：VirtualRow 对象使用 markRaw 避免深层响应式转换，提升性能
const virtualItemsCache = shallowRef<VirtualRow[]>([])

// totalSize 的响应式引用
const totalSizeRef = ref(0)

// 上次同步的滚动偏移量（用于变化检测）
let lastSyncedScrollTop = -1
let lastSyncedTotalSize = 0
let lastSyncedItemCount = 0
let lastSyncedFirstIndex = -1
let lastSyncedLastIndex = -1

const syncVirtualizer = (scrollTop: number) => {
  // 滚动位置未变化，跳过同步
  if (scrollTop === lastSyncedScrollTop) return

  syncVirtualizerImmediate(scrollTop)
}

// 是否为主虚拟滚动器（主导更新），副虚拟滚动器被动同步
const isMaster = columnIndex === 0

const syncVirtualizerImmediate = (scrollTop: number) => {
  if (!props.virtualizer) return

  lastSyncedScrollTop = scrollTop

  // 只由主虚拟滚动器触发 update，避免重复计算
  if (isMaster) {
    props.virtualizer.update()
  }

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
      // 优化：使用索引赋值代替 splice + spread，避免每帧创建新数组
      const newLength = items.length
      const existingLength = virtualItemsCache.value.length

      for (let i = 0; i < newLength; i++) {
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
        virtualItemsCache.value[i] = cached
      }
      // 截断超出部分，避免数组无限增长
      if (newLength < existingLength) {
        virtualItemsCache.value.length = newLength
      }
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
      <!-- v-memo: 移除 virtualRow.size 以避免动态高度测量导致的频繁重渲染 -->
      <!-- size 变化通过 transform: translateY() 吸收，无需重渲染整个卡片 -->
      <template v-for="virtualRow in virtualItemsCache" :key="virtualRow.key">
        <div
          v-memo="[virtualRow.key, virtualRow.recipe?.id, virtualRow.start]"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
            contain: 'strict',
            willChange: 'transform',
          }"
        >
          <RecipeCardLazy
            v-if="virtualRow.recipe"
            :recipe="virtualRow.recipe"
            :enter-delay="0"
            disable-animation
          />
        </div>
      </template>
    </div>
  </div>
</template>
