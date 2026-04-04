<script setup lang="ts">
/**
 * ErrorAlert - 错误提示组件
 */
interface Props {
  error: string | null
}

defineProps<Props>()
</script>

<template>
  <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
    <p>{{ error }}</p>
  </div>
</template>
