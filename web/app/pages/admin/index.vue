<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes'

const { t, locale } = useI18n()

useSeoMeta({
  title: () => `${t('admin.title')} - ${t('app.title')}`,
})
const localePath = useLocalePath()
const { recipes, loading, error, fetchRecipes, deleteRecipe } = useRecipes()

const searchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// 批量选择
const selectedRecipes = ref<string[]>([])

// 统计计算
const stats = computed(() => ({
  total: recipes.value.length,
  easy: recipes.value.filter(r => r.difficulty === 'easy').length,
  medium: recipes.value.filter(r => r.difficulty === 'medium').length,
  hard: recipes.value.filter(r => r.difficulty === 'hard').length,
}))

const toggleSelect = (id: string) => {
  if (selectedRecipes.value.includes(id)) {
    selectedRecipes.value = selectedRecipes.value.filter(i => i !== id)
  } else {
    selectedRecipes.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (selectedRecipes.value.length === recipes.value.length) {
    selectedRecipes.value = []
  } else {
    selectedRecipes.value = recipes.value.map(r => r.id.toString())
  }
}

const batchDelete = async () => {
  if (!confirm(`确定删除 ${selectedRecipes.value.length} 个食谱?`)) return
  for (const id of selectedRecipes.value) {
    await deleteRecipe(id)
  }
  selectedRecipes.value = []
  await fetchRecipes()
}

onMounted(async () => {
  await fetchRecipes()
})

watch(searchQuery, async () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    if (searchQuery.value) {
      await fetchRecipes({ search: searchQuery.value })
    } else {
      await fetchRecipes()
    }
  }, 300)
})

watch(() => useI18n().locale.value, async () => {
  await fetchRecipes()
})

const handleDelete = async (id: string) => {
  if (!confirm(t('admin.confirmDelete'))) return

  const success = await deleteRecipe(id)
  if (success) {
    await fetchRecipes()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-16 md:pb-0">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              📋 {{ t('admin.title') }}
            </h1>
            <p class="text-sm text-gray-600 mt-1 hidden sm:block">{{ t('admin.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <NuxtLink
              :to="localePath('/', locale)"
              class="hidden md:flex px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {{ t('nav.viewSite') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/admin/recipes/new', locale)"
              class="min-w-[44px] min-h-[44px] px-3 py-2 sm:px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base active:scale-95 touch-manipulation"
            >
              <span>+</span> <span class="hidden sm:inline">{{ t('admin.addRecipe') }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Cards -->
      <AdminStatsCards :stats="stats" />

      <!-- Batch Actions -->
      <div v-if="selectedRecipes.length > 0" class="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
        <span class="text-orange-800 font-medium">已选择 {{ selectedRecipes.length }} 个食谱</span>
        <button @click="batchDelete" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          批量删除
        </button>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('search.placeholder')"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <!-- Recipe List -->
      <div v-else class="bg-white rounded-xl shadow-md overflow-hidden">
        <!-- Empty State -->
        <div v-if="recipes.length === 0" class="text-center py-16 px-4">
          <!-- Illustration -->
          <div class="relative inline-block mb-6">
            <div class="relative">
              <svg class="w-28 h-28 mx-auto" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Plate -->
                <circle cx="60" cy="60" r="50" fill="currentColor" class="text-orange-100 dark:text-orange-900/30"/>
                <circle cx="60" cy="60" r="42" fill="currentColor" class="text-white dark:text-stone-800"/>
                <circle cx="60" cy="60" r="35" fill="currentColor" class="text-orange-50 dark:text-stone-700"/>
                <!-- Empty document -->
                <rect x="35" y="30" width="50" height="60" rx="4" fill="currentColor" class="text-gray-200 dark:text-stone-600"/>
                <rect x="42" y="40" width="36" height="4" rx="2" fill="currentColor" class="text-gray-400 dark:text-stone-400"/>
                <rect x="42" y="50" width="28" height="4" rx="2" fill="currentColor" class="text-gray-300 dark:text-stone-500"/>
                <rect x="42" y="60" width="20" height="4" rx="2" fill="currentColor" class="text-gray-300 dark:text-stone-500"/>
                <!-- Plus icon -->
                <circle cx="85" cy="85" r="18" fill="currentColor" class="text-orange-500"/>
                <path d="M85 78V92M78 85H92" stroke="white" stroke-width="3" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="absolute inset-0 bg-orange-200/30 dark:bg-orange-500/20 rounded-full blur-3xl -z-10 scale-150"></div>
          </div>
          
          <h3 class="text-xl font-bold text-gray-900 dark:text-stone-100 mb-2">{{ t('empty.title') }}</h3>
          <p class="text-gray-500 dark:text-stone-400 max-w-sm mx-auto mb-6">{{ t('empty.description') }}</p>
          
          <!-- CTA Button -->
          <NuxtLink
            :to="localePath('/admin/recipes/new')"
            class="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-full font-medium hover:bg-orange-700 transition-all hover:scale-105 active:scale-95"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ t('admin.addRecipe') }}
          </NuxtLink>
        </div>

        <AdminRecipeTable
          v-else
          :recipes="recipes"
          :selected-recipes="selectedRecipes"
          @toggle-select="toggleSelect"
          @delete="handleDelete"
        />
      </div>
    </main>

    <BottomNav />
  </div>
</template>
