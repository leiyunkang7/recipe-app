<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  errorMessage: string
  errorDetails: string
  errorComponent: string
  showDetails: boolean
  isDetailsExpanded: boolean
}>()

const emit = defineEmits<{
  retry: []
  toggleDetails: []
}>()
</script>

<template>
  <div
    class="error-boundary-fallback"
    role="alert"
    aria-live="assertive"
  >
    <div class="bg-gradient-to-br from-stone-50 to-orange-50 dark:from-stone-900 dark:to-red-900/20 min-h-[200px] flex items-center justify-center p-6 rounded-2xl border border-red-200 dark:border-red-800/50">
      <div class="text-center max-w-sm mx-auto">
        <div class="text-6xl mb-4 animate-pulse">⚠️</div>

        <h3 class="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
          {{ t('errorBoundary.title') }}
        </h3>

        <p class="text-sm text-red-600 dark:text-red-400 mb-4">
          {{ errorMessage }}
        </p>

        <div class="flex flex-wrap justify-center gap-2">
          <button
            @click="emit('retry')"
            class="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all shadow-lg shadow-orange-200 dark:shadow-orange-900/30 font-medium text-sm active:scale-95"
          >
            {{ t('errorBoundary.retry') }}
          </button>

          <button
            @click="emit('toggleDetails')"
            v-if="showDetails && errorDetails"
            class="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl transition-colors font-medium text-sm"
          >
            {{ isDetailsExpanded ? t('errorBoundary.hideDetails') : t('errorBoundary.showDetails') }}
          </button>
        </div>

        <div
          v-if="showDetails && errorDetails && isDetailsExpanded"
          class="mt-4 p-3 bg-stone-100 dark:bg-stone-800 rounded-xl text-left"
        >
          <p class="text-xs font-mono text-stone-600 dark:text-stone-400 whitespace-pre-wrap break-all">
            {{ errorDetails }}
          </p>
        </div>

        <p v-if="errorComponent && showDetails" class="mt-3 text-xs text-stone-400 dark:text-stone-500">
          {{ t('errorBoundary.component') }}: {{ errorComponent }}
        </p>
      </div>
    </div>
  </div>
</template>
