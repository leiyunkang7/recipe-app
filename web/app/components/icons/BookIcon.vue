<script setup lang="ts">
import type { BaseIconProps } from '~/types/component-props'

defineProps<BaseIconProps>()
</script>

<template>
  <span :class="$attrs.class" aria-hidden="true">📖</span>
</template>
