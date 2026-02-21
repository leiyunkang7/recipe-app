<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes'

const { t } = useI18n()
const { recipes, loading, error, fetchRecipes, fetchCategories } = useRecipes()

const searchQuery = ref('')
const selectedCategory = ref('')

const categories = ref<string[]>([])

onMounted(async () => {
  await fetchRecipes()
  categories.value = await fetchCategories()
})

watch([searchQuery, selectedCategory], async () => {
  const filters: any = {}
  if (searchQuery.value) filters.search = searchQuery.value
  if (selectedCategory.value) filters.category = selectedCategory.value
  await fetchRecipes(filters)
})

watch(() => useI18n().locale.value, async () => {
  categories.value = await fetchCategories()
  const filters: any = {}
  if (searchQuery.value) filters.search = searchQuery.value
  if (selectedCategory.value) filters.category = selectedCategory.value
  await fetchRecipes(filters)
})

const difficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 text-green-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'hard': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const difficultyLabel = (difficulty: string) => {
  return t(`difficulty.${difficulty}`)
}
</script>

<template>
  <div class="min-h-screen bg-stone-50">
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-orange-600">
              🍳 {{ t('app.title') }}
            </h1>
            <p class="text-sm text-gray-600 mt-1">{{ t('app.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-4">
            <LanguageSwitcher />
            <NuxtLink
              to="/admin"
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
        <NuxtLink
          v-for="recipe in recipes"
          :key="recipe.id"
          :to="`/recipes/${recipe.id}`"
          class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
        >
          <div class="relative h-48 bg-gradient-to-br from-orange-100 to-orange-200 overflow-hidden">
            <img
              v-if="recipe.imageUrl"
              :src="recipe.imageUrl"
              :alt="recipe.title"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="text-6xl">🍽️</span>
            </div>

            <div class="absolute top-3 right-3">
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold uppercase',
                  difficultyColor(recipe.difficulty)
                ]"
              >
                {{ difficultyLabel(recipe.difficulty) }}
              </span>
            </div>
          </div>

          <div class="p-5">
            <h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
              {{ recipe.title }}
            </h3>

            <p v-if="recipe.description" class="text-gray-600 text-sm mb-4 line-clamp-2">
              {{ recipe.description }}
            </p>

            <div class="flex items-center justify-between text-sm text-gray-500">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1">
                  ⏱️ {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }} {{ t('recipe.min') }}
                </span>
                <span class="flex items-center gap-1">
                  👥 {{ recipe.servings }} {{ t('recipe.servings') }}
                </span>
              </div>
            </div>

            <div v-if="recipe.tags && recipe.tags.length > 0" class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="tag in recipe.tags.slice(0, 3)"
                :key="tag"
                class="px-2 py-1 bg-green-50 text-green-700 rounded text-xs"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
