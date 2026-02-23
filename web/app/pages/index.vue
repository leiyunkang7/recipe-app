<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes'
import { useRecipeLayout, useCategorySelect } from '~/composables/useRecipeLayout'

const { t, locale } = useI18n()

useSeoMeta({
  title: () => `${t('app.title')} - ${t('app.subtitle')}`,
  ogTitle: () => `${t('app.title')} - ${t('app.subtitle')}`,
})
const localePath = useLocalePath()
const { recipes, loading, error, fetchRecipes, fetchCategoryKeys } = useRecipes()

const searchQuery = ref('')
const selectedCategory = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const categories = ref<Array<{ id: number; name: string; displayName: string }>>([])

const debouncedSearch = async () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    const filters: Record<string, string> = {}
    if (searchQuery.value) filters.search = searchQuery.value
    if (selectedCategory.value) filters.category = selectedCategory.value
    await fetchRecipes(filters)
  }, 300)
}

onMounted(async () => {
  await fetchRecipes()
  categories.value = await fetchCategoryKeys()
})

watch([searchQuery, selectedCategory], debouncedSearch)

watch(() => useI18n().locale.value, async () => {
  categories.value = await fetchCategoryKeys()
  const filters: Record<string, string> = {}
  if (searchQuery.value) filters.search = searchQuery.value
  if (selectedCategory.value) filters.category = selectedCategory.value
  await fetchRecipes(filters)
})

const { leftColumnRecipes, rightColumnRecipes } = useRecipeLayout(() => recipes.value)
const { selectCategory } = useCategorySelect(
  () => selectedCategory.value,
  (value: string) => { selectedCategory.value = value }
)
</script>

<template>
  <div class="min-h-screen bg-stone-50 pb-16 md:pb-0">
    <header class="bg-white sticky top-0 z-50 shadow-sm">
      <div class="px-4 py-3">
        <div class="flex items-center justify-between mb-3">
          <h1 class="text-xl font-bold text-orange-600">
            🍳 {{ t('app.title') }}
          </h1>
          <div class="flex items-center gap-2">
            <LanguageSwitcher />
            <NuxtLink
              :to="localePath('/admin', locale)"
              class="hidden md:flex px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              {{ t('nav.admin') }}
            </NuxtLink>
          </div>
        </div>

        <div class="relative mb-3">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('search.placeholder')"
            class="w-full px-4 py-2.5 pl-10 rounded-full border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-gray-50 text-sm"
          />
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <div class="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <button
            @click="selectCategory('')"
            :class="[
              'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
              selectedCategory === '' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
          >
            {{ t('search.allCategories') }}
          </button>
          <button
            v-for="cat in categories"
            :key="cat.name"
            @click="selectCategory(cat.name)"
            :class="[
              'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
              selectedCategory === cat.name 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
          >
            {{ cat.displayName }}
          </button>
        </div>
      </div>
    </header>

    <main class="px-3 py-4">
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p class="text-red-800 text-sm">{{ error }}</p>
      </div>

      <div v-else-if="recipes.length === 0" class="text-center py-12">
        <p class="text-gray-600">{{ t('admin.noRecipesSearch') }}</p>
      </div>

      <div v-else class="flex gap-3">
        <div class="flex-1 flex flex-col gap-3">
          <NuxtLink
            v-for="recipe in leftColumnRecipes"
            :key="recipe.id"
            :to="localePath(`/recipes/${recipe.id}`, locale)"
            class="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="relative bg-gradient-to-br from-orange-100 to-orange-200">
              <img
                v-if="recipe.imageUrl"
                :src="recipe.imageUrl"
                :alt="recipe.title"
                class="w-full object-cover"
                loading="lazy"
              />
              <div v-else class="w-full aspect-square flex items-center justify-center">
                <span class="text-4xl">🍽️</span>
              </div>
            </div>

            <div class="p-2.5">
              <h3 class="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5">
                {{ recipe.title }}
              </h3>

              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span class="flex items-center gap-0.5">
                  ⏱️ {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }}{{ t('recipe.min') }}
                </span>
                <span>·</span>
                <span>{{ recipe.servings }}{{ t('recipe.servings') }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div class="flex-1 flex flex-col gap-3">
          <NuxtLink
            v-for="recipe in rightColumnRecipes"
            :key="recipe.id"
            :to="localePath(`/recipes/${recipe.id}`, locale)"
            class="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="relative bg-gradient-to-br from-orange-100 to-orange-200">
              <img
                v-if="recipe.imageUrl"
                :src="recipe.imageUrl"
                :alt="recipe.title"
                class="w-full object-cover"
                loading="lazy"
              />
              <div v-else class="w-full aspect-square flex items-center justify-center">
                <span class="text-4xl">🍽️</span>
              </div>
            </div>

            <div class="p-2.5">
              <h3 class="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5">
                {{ recipe.title }}
              </h3>

              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span class="flex items-center gap-0.5">
                  ⏱️ {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }}{{ t('recipe.min') }}
                </span>
                <span>·</span>
                <span>{{ recipe.servings }}{{ t('recipe.servings') }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
