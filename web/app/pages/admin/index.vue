<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
// useRecipes is auto-imported by Nuxt 3
const { t, locale } = useI18n()
import ClipboardIcon from '~/components/icons/ChartIcon.vue'

useSeoMeta({
  title: () => `${t('admin.title')} - ${t('app.title')}`,
  robots: 'noindex, nofollow',
})
const localePath = useLocalePath()
const { recipes, loading, error, fetchRecipes, deleteRecipe } = useRecipes()

const searchQuery = ref('')

// 批量选择 - 使用 Set 存储提升查找性能
const selectedRecipes = ref<Set<string>>(new Set())

// 统计计算 - 单次遍历，避免重复过滤数组
const stats = computed(() => {
  const result = { total: 0, easy: 0, medium: 0, hard: 0 }
  for (const r of recipes.value) {
    result.total++
    if (r.difficulty === 'easy') result.easy++
    else if (r.difficulty === 'medium') result.medium++
    else if (r.difficulty === 'hard') result.hard++
  }
  return result
})

const toggleSelect = (id: string) => {
  const newSet = new Set(selectedRecipes.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  selectedRecipes.value = newSet
}

const toggleSelectAll = () => {
  if (selectedRecipes.value.size === recipes.value.length) {
    selectedRecipes.value = new Set()
  } else {
    selectedRecipes.value = new Set(recipes.value.map(r => r.id.toString()))
  }
}

const batchDelete = async () => {
  if (!confirm(t('admin.confirmDeleteBatch', { count: selectedRecipes.value.size }))) return
  // 使用 Promise.all 并行删除，而非串行 await
  await Promise.all([...selectedRecipes.value].map(id => deleteRecipe(id)))
  selectedRecipes.value = new Set()
  await fetchRecipes()
}

onMounted(async () => {
  await fetchRecipes()
})

// 使用 useDebounceFn 简化防抖逻辑
const debouncedSearch = useDebounceFn(async (query: string) => {
  if (query) {
    await fetchRecipes({ search: query })
  } else {
    await fetchRecipes()
  }
}, 300)

watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})

watch(locale, async () => {
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
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardIcon class="w-6 h-6" />
              {{ t('admin.title') }}
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
      <!-- Stats Cards - lazy loaded as not critical path -->
      <LazyAdminStatsCards :stats="stats" />

      <!-- Batch Actions -->
      <div v-if="selectedRecipes.size > 0" class="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
        <span class="text-orange-800 font-medium">{{ t('admin.selected', { count: selectedRecipes.size }) }}</span>
        <button @click="batchDelete" class="min-h-[44px] px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          {{ t('admin.batchDelete') }}
        </button>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('search.placeholder')"
          class="w-full px-4 py-3.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all min-h-[44px]"
        />
      </div>

      <LoadingSpinner v-if="loading" />

      <!-- Error -->
      <ErrorAlert v-else-if="error" :error="error" />

      <!-- Recipe List -->
      <div v-else class="bg-white rounded-xl shadow-md overflow-hidden">
        <!-- Empty State using reusable component - lazy loaded -->
        <LazyRecipeEmptyState
          v-if="recipes.length === 0"
          :search-query="searchQuery"
          :selected-category="''"
          @clear-search="searchQuery = ''"
          @clear-category="() => {}"
        />

        <LazyAdminRecipeList
          v-else
          :recipes="recipes"
          :selected-recipes="[...selectedRecipes]"
          @toggle-select="toggleSelect"
          @delete="handleDelete"
        />
      </div>
    </main>

    <LazyBottomNav />
  </div>
</template>
