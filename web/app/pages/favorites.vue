<script setup lang="ts">
import type { Recipe } from '~/types'

const { t } = useI18n()
const { favoriteIds, loading, fetchFavorites } = useFavorites()

const recipes = ref<Recipe[]>([])
const localLoading = ref(true)

useSeoMeta({
  title: () => `${t('favorites.title')} - ${t('app.title')}`,
  ogTitle: () => `${t('favorites.title')} - ${t('app.title')}`,
  description: () => t('favorites.emptyDescription'),
  ogDescription: () => t('favorites.emptyDescription'),
  ogType: 'website',
  ogImage: '/icon.png',
  twitterCard: 'summary',
  twitterTitle: () => `${t('favorites.title')} - ${t('app.title')}`,
  twitterDescription: () => t('favorites.emptyDescription'),
})

const loadFavorites = async () => {
  localLoading.value = true
  recipes.value = await fetchFavorites()
  localLoading.value = false
}

onMounted(() => {
  loadFavorites()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300">
    <HeaderSection />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-stone-100">
          {{ t('favorites.title') }}
        </h1>
        <p v-if="favoriteIds.size > 0" class="mt-2 text-gray-600 dark:text-stone-400">
          {{ t('favorites.count', { count: favoriteIds.size }) }}
        </p>
      </div>

      <div v-if="localLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>

      <div v-else-if="recipes.length === 0" class="text-center py-16">
        <div class="text-6xl mb-4">💝</div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-stone-100 mb-2">
          {{ t('favorites.empty') }}
        </h2>
        <p class="text-gray-600 dark:text-stone-400 mb-6">
          {{ t('favorites.emptyDescription') }}
        </p>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors font-medium"
        >
          <span>🍳</span>
          <span>{{ t('nav.home') }}</span>
        </NuxtLink>
      </div>

      <RecipeGrid v-else :recipes="recipes" />
    </main>
  </div>
</template>
