<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  virtualizer: Virtualizer | null
}>()

// 虚拟项缓存 - 使用 shallowRef 避免深层响应式
const cachedVirtualItems = shallowRef<ReturnType<Virtualizer['getVirtualItems']>>([])

// totalSize 缓存
const cachedTotalSize = ref(0)

// 上次同步的虚拟项键集合 - 用于检测变化
let lastSyncedKeys = new Set<string | number>()

// 同步虚拟滚动器状态 - 增量更新避免不必要的重渲染
const syncVirtualizer = () => {
  if (!props.virtualizer) return

  const items = props.virtualizer.getVirtualItems()
  const totalSize = props.virtualizer.getTotalSize()

  // 只在键集合变化时更新虚拟项
  const currentKeys = new Set(items.map(item => item.key))
  const keysChanged = currentKeys.size !== lastSyncedKeys.size ||
    [...currentKeys].some(key => !lastSyncedKeys.has(key))

  if (keysChanged) {
    cachedVirtualItems.value = items
    lastSyncedKeys = currentKeys
  }

  // totalSize 变化时更新
  if (totalSize !== cachedTotalSize.value) {
    cachedTotalSize.value = totalSize
  }
}

// 监听 virtualizer 变化，更新缓存
watch(() => props.virtualizer, (virtualizer) => {
  if (virtualizer) {
    lastSyncedKeys.clear()
    syncVirtualizer()
  } else {
    cachedVirtualItems.value = []
    cachedTotalSize.value = 0
    lastSyncedKeys.clear()
  }
}, { immediate: true })

// 暴露同步方法给父组件（父组件负责滚动监听）
defineExpose({ syncVirtualizer })
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
    <div
      :style="{
        height: `${cachedTotalSize}px`,
        width: '100%',
        position: 'relative',
      }"
    >
      <div
        v-for="virtualRow in cachedVirtualItems"
        :key="virtualRow.key"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualRow.size}px`,
          transform: `translate3d(0, ${virtualRow.start}px, 0)`,
          contain: 'layout',
        }"
      >
        <LazyRecipeCard
          :recipe="recipes[virtualRow.index]"
          :enter-delay="0"
          disable-animation
        />
      </div>
    </div>
  </div>
</template>
