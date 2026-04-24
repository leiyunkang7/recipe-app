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
  categories,
  debouncedSearch,
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
      <div class="mb-8 space-y-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              @input="debouncedSearch"
              type="text"
              :placeholder="t('search.placeholder')"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div class="sm:w-64">
            <select
              v-model="selectedCategory"
              @change="handleClearCategory"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="">{{ t('search.allCategories') }}</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.name">
                {{ cat.displayName }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <div v-else-if="recipes.length === 0" class="text-center py-12">
        <p class="text-gray-600 text-lg">{{ t('search.noResults') }}</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RecipeCardLazy
          v-for="(recipe, index) in recipes"
          :key="recipe.id"
          :recipe="recipe"
          :enter-delay="index * 50"
          :search-query="searchQuery"
        />
      </div>

      <!-- Load more trigger -->
      <div v-if="hasMore" class="flex justify-center mt-8">
        <button
          v-if="!loadingMore"
          @click="loadMore"
          class="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
        >
          {{ t('search.loadMore', 'Load More') }}
        </button>
        <div v-else class="flex justify-center items-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    </main>
  </div>
</template>
