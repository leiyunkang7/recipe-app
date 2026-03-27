<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md'
})

const sizeClasses = {
  sm: 'h-6 w-6 border-2',
  md: 'h-12 w-12 border-b-2',
  lg: 'h-16 w-16 border-3'
}
</script>

<template>
  <div class="flex justify-center items-center py-12">
    <div
      class="animate-spin rounded-full border-orange-600"
      :class="sizeClasses[size]"
    ></div>
  </div>
</template>
