<script setup lang="ts">
/**
 * CookingModeProgress - 烹饪模式进度条组件
 */
interface Props {
  progress: number
}

defineProps<Props>()
</script>

<template>
  <div class="h-1 bg-stone-800 flex-shrink-0">
    <div
      class="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
      :style="{ width: `${progress}%` }"
    ></div>
  </div>
</template>
