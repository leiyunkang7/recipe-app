<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const props = defineProps<{
  searchQuery: string
  selectedCategory: string
}>()

const emit = defineEmits<{
  clearSearch: []
  clearCategory: []
}>()

const hasFilters = computed(() => props.searchQuery || props.selectedCategory)
</script>

<template>
  <div class="text-center py-12 md:py-20 px-4">
    <!-- Enhanced SVG Illustration -->
    <div class="relative inline-block mb-8">
      <EmptyPlateIllustration />
      <!-- Ambient glow -->
      <div class="absolute inset-0 bg-gradient-to-br from-amber-200/40 via-orange-200/20 to-amber-200/40 dark:from-amber-500/20 dark:via-orange-500/10 dark:to-amber-500/20 rounded-full blur-3xl -z-10 scale-125"></div>
    </div>

    <!-- Content based on state -->
    <template v-if="hasFilters">
      <!-- No results state -->
      <div class="mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-2">{{ t('empty.noResults') }}</h3>
        <p class="text-gray-500 dark:text-stone-400 max-w-sm mx-auto">{{ t('empty.tryDifferent') }}</p>
      </div>
    </template>
    <template v-else>
      <!-- Empty state - First time user -->
      <div class="mb-8">
        <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-3">{{ t('empty.title') }}</h3>
        <p class="text-gray-500 dark:text-stone-400 max-w-md mx-auto mb-6">{{ t('empty.description') }}</p>

        <!-- Getting Started Steps -->
        <div class="max-w-lg mx-auto">
          <EmptyStateTips />
        </div>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <NuxtLink
            :to="localePath('/admin/recipes/new')"
            class="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-600/25"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ t('empty.addFirstRecipe') }}
          </NuxtLink>

          <!-- Secondary actions -->
          <EmptyStateQuickActions />
        </div>
      </div>
    </template>

    <!-- Clear Filters -->
    <div v-if="hasFilters" class="flex flex-wrap justify-center gap-3 mt-4">
      <button
        v-if="searchQuery"
        @click="emit('clearSearch')"
        class="flex items-center gap-2 px-5 py-2.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-all hover:scale-105"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        {{ t('search.clearSearch') }}
      </button>
      <button
        v-if="selectedCategory"
        @click="emit('clearCategory')"
        class="flex items-center gap-2 px-5 py-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-all hover:scale-105"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        {{ t('search.allCategories') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
