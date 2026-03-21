<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  error: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div v-if="error" class="max-w-md mx-auto">
    <div class="bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
      <div class="text-5xl mb-4">😕</div>
      <h3 class="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">{{ t('error.title') }}</h3>
      <p class="text-red-600 dark:text-red-400 text-sm mb-4">{{ error }}</p>
      <button
        @click="emit('retry')"
        class="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-red-900/30 font-medium"
      >
        {{ t('error.retry') }}
      </button>
    </div>
  </div>
</template>
