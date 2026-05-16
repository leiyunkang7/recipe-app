<script setup lang="ts">
/**
 * HomePage - Uses centralized useHomePage composable
 *
 * Performance characteristics (via useHomePage composable):
 * - API-based paginated queries (PAGE_SIZE=20) via useRecipeQueries
 * - RecipeListItem[] (lightweight, no full ingredients/steps joins)
 * - AbortController for request cancellation on rapid filter changes
 * - shallowRef for reactive state (no SSR state-leak)
 * - Debounced search (300ms) via @vueuse/core
 * - Parallel init: categories + cuisines + recipes fetched simultaneously
 */
import { useHomePage } from '~/composables/useHomePage'

const { t } = useI18n()
const localePath = useLocalePath()

const {
  recipes,
  loading,
  loadingMore,
  error,
  hasMore,
  searchQuery,
  selectedCategory,
  loadMore,
  init,
  handleClearSearch,
  handleClearCategory,
} = useHomePage()

onMounted(() => {
  init()
})
</script>

<template>
  <div class="min-h-screen bg-stone-50">
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-orange-600">
              {{ t('app.title') }}
            </h1>
            <p class="text-sm text-gray-600 mt-1">{{ t('app.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-4">
            <LanguageSwitcher />
            <NuxtLink
              :to="localePath('/admin')"
              class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {{ t('nav.admin') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RecipeListSection
        :recipes="recipes"
        :loading="loading"
        :loading-more="loadingMore"
        :error="error"
        :has-more="hasMore"
        :search-query="searchQuery"
        :selected-category="selectedCategory"
        @load-more="loadMore"
        @retry="init"
        @clear-search="handleClearSearch"
        @clear-category="handleClearCategory"
      />
    </main>
  </div>
</template>
