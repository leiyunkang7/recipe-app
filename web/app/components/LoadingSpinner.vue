<script setup lang="ts">
/**
 * LoadingSpinner - Configurable loading spinner component
 * Replaces duplicated inline spinner markup across the app.
 */

interface Props {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  centered?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'border-orange-600',
  centered: true,
})

const sizeClasses: Record<string, string> = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}
</script>

<template>
  <div :class="[centered ? 'flex justify-center items-center' : '']" :data-size="size">
    <div :class="['animate-spin rounded-full border-b-2', sizeClasses[size], color]" />
  </div>
</template>
