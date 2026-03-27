<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  virtualizer: Virtualizer | null
}>()

// shallowRef 避免对返回数组进行深层响应式转换
const virtualItems = computed(() => props.virtualizer?.getVirtualItems() ?? [])
// totalSize 只在 items 变化时更新，滚动时不会触发重算
const totalSize = computed(() => props.virtualizer?.getTotalSize() ?? 0)
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
    <div
      :style="{
        height: `${totalSize}px`,
        width: '100%',
        position: 'relative',
      }"
    >
      <div
        v-for="virtualRow in virtualItems"
        :key="virtualRow.key"
        v-memo="[virtualRow.key, virtualRow.start, virtualRow.size]"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
          contain: 'layout style',
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
