<script setup lang="ts">
defineProps<{
  class?: string
}>()
</script>

<template>
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    :class="['w-3 h-3', $attrs.class]"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="3"
      d="M5 13l4 4L19 7"
    />
  </svg>
</template>
