<script setup lang="ts">
const props = defineProps<{
  count?: number
}>()

const skeletonCount = props.count || 8
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
    <div
      v-for="n in skeletonCount"
      :key="`skeleton-${n}`"
      v-memo="[n]"
      class="bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm animate-pulse"
    >
      <div class="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600 relative overflow-hidden">
        <div class="shimmer-bar"></div>
      </div>
      <div class="p-4 space-y-3">
        <div class="h-4 bg-gray-200 dark:bg-stone-700 rounded-lg w-3/4 relative overflow-hidden">
          <div class="shimmer-bar"></div>
        </div>
        <div class="h-3 bg-gray-200 dark:bg-stone-700 rounded-lg w-1/2 relative overflow-hidden">
          <div class="shimmer-bar"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shimmer-bar {
  @apply absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
