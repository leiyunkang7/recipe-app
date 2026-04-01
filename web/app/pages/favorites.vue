<script setup lang="ts">
import type { Recipe } from '~/types'

const { t } = useI18n()
const router = useRouter()
const { favoriteIds, loading, folders, fetchFavorites, fetchFolders, createFolder, renameFolder, deleteFolder, fetchFavoritesByFolder } = useFavorites()
const { show: showToast } = useToast()

const recipes = shallowRef<Recipe[]>([])
const selectedFolderId = ref<string | null>(null)
const isLoadingRecipes = ref(false)

// Toast helper
const toast = (message: string, type: 'success' | 'error' = 'success') => {
  showToast(message, type)
}

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

const loadRecipes = async () => {
  isLoadingRecipes.value = true
  try {
    if (selectedFolderId.value === null) {
      recipes.value = await fetchFavorites()
    } else {
      recipes.value = await fetchFavoritesByFolder(selectedFolderId.value)
    }
  } finally {
    isLoadingRecipes.value = false
  }
}

const handleFolderSelect = async (folderId: string | null) => {
  selectedFolderId.value = folderId
  await loadRecipes()
}

const handleCreateFolder = async (name: string, color: string) => {
  const result = await createFolder(name, color)
  if (result) {
    toast(t('favorites.folderCreated'), 'success')
  }
}

const handleRenameFolder = async (folderId: string, newName: string) => {
  const success = await renameFolder(folderId, newName)
  if (success) {
    toast(t('favorites.folderRenamed'), 'success')
  }
}

const handleDeleteFolder = async (folderId: string) => {
  const success = await deleteFolder(folderId)
  if (success) {
    if (selectedFolderId.value === folderId) {
      selectedFolderId.value = null
    }
    toast(t('favorites.folderDeleted'), 'success')
    await loadRecipes()
  }
}

const handleExplore = () => {
  router.push('/')
}

// Load recipes when folder selection changes - immediate: true handles both initial load and changes
watch(selectedFolderId, () => {
  loadRecipes()
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

      <!-- Folder Navigation -->
      <LazyFavoriteFolders
        :folders="folders"
        :selected-folder-id="selectedFolderId"
        @select="handleFolderSelect"
        @create="handleCreateFolder"
        @rename="handleRenameFolder"
        @delete="handleDeleteFolder"
      />

      <LoadingSpinner v-if="isLoadingRecipes || loading" />

      <LazyFavoritesEmptyState
          v-else-if="recipes.length === 0"
          @explore="handleExplore"
        />

      <LazyRecipeGrid v-else :recipes="recipes" />
    </main>
  </div>
</template>
