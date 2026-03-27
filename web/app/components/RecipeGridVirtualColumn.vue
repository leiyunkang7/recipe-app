<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  virtualizer: Virtualizer | null
}>()

// 虚拟项缓存
const cachedVirtualItems = shallowRef<ReturnType<Virtualizer['getVirtualItems']>>([])

// totalSize 缓存
const cachedTotalSize = ref(0)

// 同步虚拟滚动器状态
const syncVirtualizer = () => {
  if (!props.virtualizer) return
  cachedVirtualItems.value = props.virtualizer.getVirtualItems()
  cachedTotalSize.value = props.virtualizer.getTotalSize()
}

// 监听 virtualizer 变化，更新缓存
watch(() => props.virtualizer, (virtualizer) => {
  if (virtualizer) {
    syncVirtualizer()
  } else {
    cachedVirtualItems.value = []
    cachedTotalSize.value = 0
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
        v-memo="[virtualRow.key, virtualRow.start, virtualRow.size]"
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
