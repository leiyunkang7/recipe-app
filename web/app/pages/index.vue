<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { recipes, loading, error, fetchRecipes, fetchCategories } = useRecipes()

const searchQuery = ref('')
const selectedCategory = ref('')

const categories = ref<string[]>([])

// Debounced search query to reduce API calls
const debouncedSearchQuery = ref('')
const debouncedSetQuery = useDebounceFn((val: string) => {
  debouncedSearchQuery.value = val
}, 300, { maxWait: 500 })

onMounted(async () => {
  const [, fetchedCategories] = await Promise.allSettled([
    fetchRecipes(),
    fetchCategories(),
  ])
  if (fetchedCategories.status === 'fulfilled') {
    categories.value = fetchedCategories.value
  }
})

// Debounce search input (300ms delay, max 500ms)
watch(searchQuery, (newVal) => {
  debouncedSetQuery(newVal ?? '')
})

// Fetch categories when locale changes
watch(locale, async () => {
  categories.value = await fetchCategories()
})

// React to search and category changes
watch([debouncedSearchQuery, selectedCategory], () => {
  const filters: Record<string, string> = {}
  if (debouncedSearchQuery.value) filters.search = debouncedSearchQuery.value
  if (selectedCategory.value) filters.category = selectedCategory.value
  fetchRecipes(filters)
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
              type="text"
              :placeholder="t('search.placeholder')"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div class="sm:w-64">
            <select
              v-model="selectedCategory"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="">{{ t('search.allCategories') }}</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
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
        <p class="text-gray-600 text-lg">{{ t('admin.noRecipesSearch') }}</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RecipeCardLazy
          v-for="(recipe, index) in recipes"
          :key="recipe.id"
          :recipe="recipe"
          :enter-delay="index * 50"
          :search-query="debouncedSearchQuery"
        />
      </div>
    </main>
  </div>
</template>
