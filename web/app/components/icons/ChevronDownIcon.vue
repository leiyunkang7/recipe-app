<script setup lang="ts">
/**
 * ChevronDownIcon - 向下箭头图标
 * 用于手风琴展开/折叠指示器
 */
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
      d="M19 9l-7 7-7-7"
    />
  </svg>
</template>
