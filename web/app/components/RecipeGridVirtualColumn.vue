<script setup lang="ts">
import { markRaw } from 'vue'
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

// 注入共享虚拟项上下文（由 RecipeGrid 提供）
// 从列（columnIndex !== 0）使用共享数据避免重复调用 getVirtualItems()
const sharedVirtualItems = inject<{
  items: VirtualItem[]
  totalSize: number
  masterColumnIndex: number
} | null>('sharedVirtualItems', null)

// 是否为主列（计算虚拟项）
const isMasterColumn = columnIndex === 0

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

// 主列的 syncVirtualizer 由 RecipeGrid 在滚动时调用
// 从列通过 watch sharedVirtualItems 被动更新
const syncVirtualizer = (scrollTop: number) => {
  // 滚动位置未变化，跳过同步（仅主列需要这个检查）
  if (isMasterColumn && scrollTop === lastSyncedScrollTop) return

  syncVirtualizerImmediate(scrollTop)
}

// 只由主虚拟滚动器触发 update，避免重复计算
// 关键优化：移除了 virtualizer.update() 调用，因为 @tanstack/vue-virtual 会自动
// 响应滚动事件，无需在每次滚动时手动调用 update()
// update() 只在内容尺寸变化时需要（如 ResizeObserver 测量到新高度）
const syncVirtualizerImmediate = (scrollTop: number) => {
  if (!props.virtualizer && isMasterColumn) return

  // 主列只需更新滚动位置记录，无需调用 update()
  // 虚拟滚动器通过 getScrollElement 自动响应滚动
  if (isMasterColumn) {
    lastSyncedScrollTop = scrollTop
  }

  // 主列直接使用自己的 virtualizer，从列使用共享的 items
  const items = isMasterColumn
    ? props.virtualizer!.getVirtualItems()
    : (sharedVirtualItems?.items ?? [])
  const newTotalSize = isMasterColumn
    ? props.virtualizer!.getTotalSize()
    : (sharedVirtualItems?.totalSize ?? 0)
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
          // recipe 可能已变化，需要更新引用（但跳过相同的对象）
          const newRecipe = props.recipes[index]
          if (cached.recipe !== newRecipe) {
            cached.recipe = newRecipe
          }
        } else {
          // 创建新对象并缓存，使用 markRaw 避免深层响应式转换
          cached = markRaw({
            ...item,
            recipe: props.recipes[index],
          })
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

// 从列监听共享虚拟项变化，主列通过 syncVirtualizer 直接更新
watch(
  () => sharedVirtualItems?.items,
  (newItems) => {
    if (!isMasterColumn && newItems && newItems.length > 0) {
      // 从列使用共享的 items，需要手动调用 syncVirtualizerImmediate
      // 由于从列不需要触发 update()，传入一个虚拟的 scrollTop
      syncVirtualizerImmediate(lastSyncedScrollTop)
    }
  },
  { deep: false }
)

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
          v-memo="[virtualRow.key, virtualRow.recipe?.id]"
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
