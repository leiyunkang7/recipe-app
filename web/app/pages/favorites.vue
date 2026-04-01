<script setup lang="ts">
import type { Recipe } from '~/types'

const { t } = useI18n()
const router = useRouter()
const { favoriteIds, loading, fetchFavorites } = useFavorites()

const recipes = shallowRef<Recipe[]>([])

useSeoMeta({
  title: () => `${t('favorites.title')} - ${t('app.title')}`,
  ogTitle: () => `${t('favorites.title')} - ${t('app.title')}`,
  description: () => t('favorites.emptyDescription'),
  ogDescription: () => t('favorites.emptyDescription'),
  ogType: 'website',
  ogImage: '/icon.png',
  ogImageAlt: '食谱收藏图标',
  twitterCard: 'summary',
  twitterTitle: () => `${t('favorites.title')} - ${t('app.title')}`,
  twitterDescription: () => t('favorites.emptyDescription'),
  twitterImageAlt: '食谱收藏图标',
})

const loadFavorites = async () => {
  recipes.value = await fetchFavorites()
}

const handleExplore = () => {
  router.push('/')
}

// Auto-refresh when favoriteIds change (e.g., added/removed elsewhere)
watch(favoriteIds, () => {
  loadFavorites()
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300">
    <LazyHeaderSection />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-stone-100">
          {{ t('favorites.title') }}
        </h1>
        <p v-if="favoriteIds.size > 0" class="mt-2 text-gray-600 dark:text-stone-400">
          {{ t('favorites.count', { count: favoriteIds.size }) }}
        </p>
      </div>

      <LoadingSpinner v-if="loading" />

      <LazyFavoritesEmptyState
          v-else-if="recipes.length === 0"
          @explore="handleExplore"
        />

      <LazyRecipeGrid v-else :recipes="recipes" />
    </main>
  </div>
</template>
