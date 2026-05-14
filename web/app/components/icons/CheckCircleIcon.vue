<script setup lang="ts">
/**
 * CheckCircleIcon - 完成勾选图标
 * 用于已完成的步骤标记
 */
import type { BaseIconProps } from '~/types/component-props'

defineProps<BaseIconProps>()
</script>

<template>
  <svg
    fill="currentColor"
    viewBox="0 0 20 20"
    :class="$attrs.class"
  >
    <path
      fill-rule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clip-rule="evenodd"
    />
  </svg>
</template>
