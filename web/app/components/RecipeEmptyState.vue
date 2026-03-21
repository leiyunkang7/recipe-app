<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  searchQuery: string
  selectedCategory: string
}>()

const emit = defineEmits<{
  clearSearch: []
  clearCategory: []
}>()
</script>

<template>
  <div class="text-center py-16 md:py-24">
    <div class="relative inline-block mb-6">
      <div class="text-7xl animate-bounce" style="animation-duration: 2s;">🍽️</div>
      <div class="absolute inset-0 bg-orange-200/30 dark:bg-orange-500/20 rounded-full blur-2xl -z-10"></div>
    </div>
    
    <template v-if="searchQuery || selectedCategory">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-stone-100 mb-3">{{ t('empty.noResults') }}</h3>
      <p class="text-gray-500 dark:text-stone-400 max-w-sm mx-auto mb-4">{{ t('empty.tryDifferent') }}</p>
    </template>
    <template v-else>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-stone-100 mb-3">{{ t('empty.title') }}</h3>
      <p class="text-gray-500 dark:text-stone-400 max-w-sm mx-auto">{{ t('empty.description') }}</p>
    </template>
    
    <div class="mt-6 flex flex-wrap justify-center gap-2">
      <button 
        v-if="searchQuery"
        @click="emit('clearSearch')"
        class="px-4 py-2 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors"
      >
        {{ t('search.clearSearch') }} ✕
      </button>
      <button 
        v-if="selectedCategory"
        @click="emit('clearCategory')"
        class="px-4 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
      >
        {{ t('search.allCategories') }} ✕
      </button>
    </div>
  </div>
</template>
