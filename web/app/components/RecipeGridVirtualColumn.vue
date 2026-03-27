<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  virtualizer: Virtualizer | null
}>()

// 虚拟项缓存 - 使用 shallowRef 避免深层响应式转换
const virtualItemsCache = shallowRef<ReturnType<Virtualizer['getVirtualItems']>>([])

// totalSize 的响应式引用 - 只在真正变化时更新
const totalSizeRef = ref(0)

// 上次同步的边界状态 - 用于快速跳过
let lastSyncedFirstKey: string | number | undefined
let lastSyncedLastKey: string | number | undefined
let lastSyncedCount = 0

// key 集合缓存 - 使用 Set 实现 O(1) 查找
let lastItemKeysSet = new Set<string | number>()

// 优化：使用 Set 替代数组遍历，将 hasItemsChanged 的复杂度从 O(n) 降到 O(1)
// 同时保持数组用于边界比较（数量有限）
const hasItemsChanged = (
  newItems: ReturnType<Virtualizer['getVirtualItems']>
): boolean => {
  const count = newItems.length

  // 如果数量不同，肯定变了
  if (count !== lastItemKeysSet.size) {
    return true
  }

  // 数量相同，使用 Set 快速判断是否有变化
  // 虚拟滚动器返回的 items 是按 start 排序的，顺序稳定
  for (let i = 0; i < count; i++) {
    if (!lastItemKeysSet.has(newItems[i].key)) {
      return true
    }
  }

  return false
}

// 同步虚拟滚动器状态 - 极致优化版本
// 核心优化：
// 1. 只比较 key 集合变化，避免深层比较
// 2. 只在边界真正变化时更新缓存
// 3. 移除不必要的响应式更新
// 4. v-memo 兜底防止不必要的子组件重渲染
const syncVirtualizer = () => {
  if (!props.virtualizer) return

  const items = props.virtualizer.getVirtualItems()
  const newTotalSize = props.virtualizer.getTotalSize()

  // 快速路径：先检查边界状态
  const firstKey = items[0]?.key
  const lastKey = items[items.length - 1]?.key
  const count = items.length

  // 边界没变时，跳过更新
  if (count === lastSyncedCount && firstKey === lastSyncedFirstKey && lastKey === lastSyncedLastKey) {
    return
  }

  // 检查 items 内容是否真的变了（通过 key 集合判断）
  if (!hasItemsChanged(items)) {
    // 边界没变，items 也没变，更新边界状态后直接返回
    lastSyncedFirstKey = firstKey
    lastSyncedLastKey = lastKey
    lastSyncedCount = count
    return
  }

  // 更新边界状态
  lastSyncedFirstKey = firstKey
  lastSyncedLastKey = lastKey
  lastSyncedCount = count

  // 更新 key Set 缓存 - O(1) 查找
  lastItemKeysSet = new Set(items.map(item => item.key))

  // 使用浅拷贝避免 Vue 对 items 数组进行深层响应式转换
  virtualItemsCache.value = items.slice()

  // 只在 totalSize 真正变化时更新（减少响应式更新）
  if (newTotalSize !== totalSizeRef.value) {
    totalSizeRef.value = newTotalSize
  }
}

// 监听 virtualizer 变化
watch(() => props.virtualizer, (virtualizer) => {
  if (virtualizer) {
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
    lastItemKeysSet = new Set()
    syncVirtualizer()
  } else {
    virtualItemsCache.value = []
    totalSizeRef.value = 0
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
    lastItemKeysSet = new Set()
  }
}, { immediate: true })

// 暴露同步方法给父组件（父组件负责滚动监听）
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
      <template v-for="virtualRow in virtualItemsCache.value" :key="virtualRow.key">
        <div
          v-memo="[virtualRow.key]"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translate3d(0, ${virtualRow.start}px, 0)`,
            contain: 'layout',
            willChange: 'transform',
            contentVisibility: 'auto',
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
