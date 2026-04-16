<script setup lang="ts">
/**
 * ShimmerShimmer - Reusable shimmer loading placeholder component
 *
 * Features:
 * - Configurable aspect ratio or fixed size
 * - Automatic dark mode support
 * - Respects prefers-reduced-motion
 * - Customizable gradient colors
 *
 * Usage:
 * <ShimmerShimmer />                                    <!-- Default: 100% width, 1rem height -->
 * <ShimmerShimmer class="rounded-lg w-3/4 h-4" />      <!-- Custom size via class -->
 * <ShimmerShimmer aspect-ratio="4/3" />                 <!-- Aspect ratio -->
 */
interface Props {
  /** CSS aspect ratio for the shimmer container */
  aspectRatio?: string
  /** Whether to fill the parent container */
  fill?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  aspectRatio: '',
  fill: false,
})

const containerClasses = computed(() => {
  const base = 'relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600'
  if (props.fill) return `${base} absolute inset-0`
  if (props.aspectRatio) return `${base}`
  return `${base} rounded-lg`
})
</script>

<template>
  <div
    :class="containerClasses"
    :style="aspectRatio ? { aspectRatio } : undefined"
  >
    <div class="shimmer-slide absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
    <slot />
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .animate-shimmer {
    animation: none;
  }
}
</style>
