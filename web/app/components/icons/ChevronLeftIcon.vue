<script setup lang="ts">
import type { BaseIconProps } from '~/types/component-props'

defineProps<BaseIconProps>()
</script>

<template>
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    :class="$attrs.class"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M15 19l-7-7 7-7"
    />
  </svg>
</template>
