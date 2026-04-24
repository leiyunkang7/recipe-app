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
      stroke-width="3"
      d="M5 13l4 4L19 7"
    />
  </svg>
</template>
