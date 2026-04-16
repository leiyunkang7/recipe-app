<script setup lang="ts">
import type { Recipe } from "~/types"

const { t } = useI18n()
const { trackPageView } = useAnalytics()
const router = useRouter()
const { favoriteIds, loading, folders, fetchFavorites, fetchFolders, createFolder, renameFolder, deleteFolder, fetchFavoritesByFolder } = useFavorites()
const { show: showToast } = useToast()
const {
  selectedRecipeIds,
  isSelectionMode,
  selectedCount,
  isBatchOperating,
  toggleSelection,
  selectAll,
  clearSelection,
  batchRemoveFavorites,
  batchMoveToFolder,
} = useFavoritesBatch()

const recipes = shallowRef<Recipe[]>([])
const selectedFolderId = ref<string | null>(null)
const isLoadingRecipes = ref(false)

useSeoMeta({
  title: () => `${t("favorites.title")} - ${t("app.title")}`,
  ogTitle: () => `${t("favorites.title")} - ${t("app.title")}`,
  description: () => t("favorites.emptyDescription"),
  ogDescription: () => t("favorites.emptyDescription"),
  ogType: "website",
  ogImage: "/icon.png",
  ogImageAlt: () => t("favorites.ogImageAlt"),
  twitterCard: "summary",
  twitterTitle: () => `${t("favorites.title")} - ${t("app.title")}`,
  twitterDescription: () => t("favorites.emptyDescription"),
  twitterImageAlt: () => t("favorites.twitterImageAlt"),
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

const handleFolderSelect = (folderId: string | null) => {
  selectedFolderId.value = folderId
}

const handleCreateFolder = async (name: string, color: string) => {
  const result = await createFolder(name, color)
  if (result) {
    showToast(t("favorites.folderCreated"), "success")
  }
}

const handleRenameFolder = async (folderId: string, newName: string) => {
  const success = await renameFolder(folderId, newName)
  if (success) {
    showToast(t("favorites.folderRenamed"), "success")
  }
}

const handleDeleteFolder = async (folderId: string) => {
  const success = await deleteFolder(folderId)
  if (success) {
    if (selectedFolderId.value === folderId) {
      selectedFolderId.value = null
    } else {
      await loadRecipes()
    }
    showToast(t("favorites.folderDeleted"), "success")
  }
}

const handleExplore = () => {
  router.push("/")
}

// Toggle selection mode
const toggleSelectionMode = () => {
  isSelectionMode.value = !isSelectionMode.value
  if (!isSelectionMode.value) {
    clearSelection()
  }
}

// Handle toggle select on a recipe card
const handleToggleSelect = (recipeId: string) => {
  toggleSelection(recipeId)
}

// Handle select all
const handleSelectAll = () => {
  selectAll(recipes.value.map(r => r.id))
}

// Handle batch remove
const handleBatchRemove = async (recipeIds: string[]) => {
  const idsToRemove = recipeIds.length > 0 ? recipeIds : [...selectedRecipeIds.value]
  const result = await batchRemoveFavorites(idsToRemove, (removedIds) => {
    // Optimistic update: use Set for O(1) lookup instead of O(M*N) includes
    const removedSet = new Set(removedIds)
    recipes.value = recipes.value.filter(r => !removedSet.has(r.id))
  })
  if (result.success) {
    showToast(t("favorites.batchRemoved", { count: result.removed }), "success")
    clearSelection()
  } else {
    // Rollback: reload recipes on failure
    await loadRecipes()
    showToast(t("favorites.batchError"), "error")
  }
}

// Handle batch move to folder
const handleBatchMoveToFolder = async (folderId: string | null) => {
  const result = await batchMoveToFolder([...selectedRecipeIds.value], folderId, () => {
    // Optimistic update: will reload on success
  })
  if (result.success) {
    showToast(t("favorites.batchMoved", { count: result.moved }), "success")
    clearSelection()
    await loadRecipes()
  } else {
    showToast(t("favorites.batchError"), "error")
  }
}

// Precompute selected IDs as a Set for O(1) lookup in template
// selectedRecipeIds is already a Set, so no conversion needed
const isRecipeSelected = (recipeId: string) => selectedRecipeIds.value.has(recipeId)

// Computed for showing batch action bar
const showBatchBar = computed(() => {
  return isSelectionMode.value && selectedCount.value > 0
})

// Single-pass column split to avoid repeated O(2N) filtering on each render
const columnSplit = computed(() => {
  const left: Recipe[] = []
  const right: Recipe[] = []
  for (let i = 0; i < recipes.value.length; i++) {
    if (i % 2 === 0) left.push(recipes.value[i])
    else right.push(recipes.value[i])
  }
  return { left, right }
})
const leftColumnRecipes = computed(() => columnSplit.value.left)
const rightColumnRecipes = computed(() => columnSplit.value.right)

// Watch for folder selection changes
watch(selectedFolderId, () => {
  loadRecipes()
}, { immediate: true })

// Expose clearSelection for BatchActionBar
defineExpose({
  clearSelection,
})

onMounted(() => {
  trackPageView('favorites')
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300 pb-20">
    <LazyHeaderSection />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8 flex items-start justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-stone-100">
            {{ t("favorites.title") }}
          </h1>
          <p v-if="favoriteIds.length > 0" class="mt-2 text-gray-600 dark:text-stone-400">
            {{ t("favorites.count", { count: favoriteIds.length }) }}
          </p>
        </div>

        <!-- Selection mode toggle -->
        <button
          v-if="recipes.length > 0"
          @click="toggleSelectionMode"
          class="px-4 py-2 rounded-lg font-medium transition-all duration-200"
          :class="isSelectionMode
            ? 'bg-orange-500 text-white hover:bg-orange-600'
            : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600'"
        >
          <span v-if="isSelectionMode">{{ t("favorites.exitSelectionMode") }}</span>
          <span v-else>{{ t("favorites.selectMultiple") }}</span>
        </button>
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

      <!-- Selection toolbar (when in selection mode but no items selected) -->
      <div v-if="isSelectionMode && selectedCount === 0" class="mb-4 flex items-center justify-between bg-stone-100 dark:bg-stone-800 rounded-lg px-4 py-3">
        <p class="text-sm text-stone-600 dark:text-stone-300">
          {{ t("favorites.selectionHint") }}
        </p>
        <button
          @click="handleSelectAll"
          class="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
        >
          {{ t("favorites.selectAll") }}
        </button>
      </div>

      <LoadingSpinner v-if="isLoadingRecipes || loading" />

      <LazyFavoritesEmptyState
        v-else-if="recipes.length === 0"
        @explore="handleExplore"
      />

      <!-- Recipe Grid with Selection -->
      <div v-else>
        <!-- Selection mode: use selectable cards -->
        <div v-if="isSelectionMode" class="flex flex-col gap-4 md:gap-5">
          <div class="flex flex-col sm:flex-row gap-4 md:gap-5">
            <!-- Left column -->
            <div class="flex-1 flex flex-col gap-4 md:gap-5">
              <LazySelectableRecipeCard
                v-for="(recipe, index) in leftColumnRecipes"
                :key="recipe.id"
                :recipe="recipe"
                :is-selected="isRecipeSelected(recipe.id)"
                :enter-delay="index * 50"
                @toggle-select="handleToggleSelect"
              />
            </div>
            <!-- Right column -->
            <div class="flex-1 flex flex-col gap-4 md:gap-5">
              <LazySelectableRecipeCard
                v-for="(recipe, index) in rightColumnRecipes"
                :key="recipe.id"
                :recipe="recipe"
                :is-selected="isRecipeSelected(recipe.id)"
                :enter-delay="(recipes.length / 2 + index) * 50"
                @toggle-select="handleToggleSelect"
              />
            </div>
          </div>
        </div>

        <!-- Normal mode: use standard grid -->
        <LazyRecipeGrid
          v-else
          :recipes="recipes"
        />
      </div>
    </main>

    <!-- Batch Action Bar -->
    <LazyBatchActionBar
      v-if="showBatchBar"
      :selected-count="selectedCount"
      :folders="folders"
      :is-operating="isBatchOperating"
      @move-to-folder="handleBatchMoveToFolder"
      @remove="handleBatchRemove"
      @clear-selection="clearSelection"
    />

    <LazyBottomNav />
  </div>
</template>
