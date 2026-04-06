<script setup lang="ts">
interface Props {
  class?: string
}

withDefaults(defineProps<Props>(), {
  class: ''
})
</script>

<template>
  <span :class="['text-lg leading-none', $props.class]" aria-hidden="true">📖</span>
</template>
