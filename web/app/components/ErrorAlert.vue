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
  <div v-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 paper-surface elevation-1">
    <p>{{ error }}</p>
  </div>
</template>
