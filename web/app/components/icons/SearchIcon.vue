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
    :class="['w-5 h-5', $attrs.class]"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M21 21l-6-6m2-5a7 7 0 11-18 0 7 7 0 0118 0z"
    />
  </svg>
</template>
