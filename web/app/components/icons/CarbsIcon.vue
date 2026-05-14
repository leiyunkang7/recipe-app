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
      d="M21 15.545c0-2.104-1.456-3.545-3.545-3.545H6.545c-2.089 0-3.545 1.441-3.545 3.545v.91c0 2.104 1.456 3.545 3.545 3.545h10.91c2.089 0 3.545-1.441 3.545-3.545v-.91z"
    />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M12 4.545v15.91"
    />
  </svg>
</template>
