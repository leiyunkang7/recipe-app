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

// 新增：批量选择
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
  <div class="min-h-screen bg-gray-50 pb-16 md:pb-0">
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
      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="text-3xl font-bold text-orange-600">{{ stats.total }}</div>
          <div class="text-sm text-gray-600">总食谱</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="text-3xl font-bold text-green-600">{{ stats.easy }}</div>
          <div class="text-sm text-gray-600">简单</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="text-3xl font-bold text-yellow-600">{{ stats.medium }}</div>
          <div class="text-sm text-gray-600">中等</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="text-3xl font-bold text-red-600">{{ stats.hard }}</div>
          <div class="text-sm text-gray-600">困难</div>
        </div>
      </div>

      <!-- 批量操作 -->
      <div v-if="selectedRecipes.length > 0" class="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
        <span class="text-orange-800 font-medium">已选择 {{ selectedRecipes.length }} 个食谱</span>
        <button @click="batchDelete" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          批量删除
        </button>
      </div>

      <div class="mb-6">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('search.placeholder')"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <div v-else class="bg-white rounded-xl shadow-md overflow-hidden">
        <div v-if="recipes.length === 0" class="text-center py-12">
          <p class="text-gray-600">{{ t('admin.noRecipes') }}</p>
        </div>

        <div v-else class="overflow-x-auto -mx-4 md:mx-0">
          <!-- Desktop Table -->
          <table class="hidden md:table w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('admin.recipe') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('recipe.category') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('form.difficulty') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('admin.time') }}
                </th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {{ t('admin.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="recipe in recipes"
                :key="recipe.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-4">
                    <input 
                      type="checkbox" 
                      :checked="selectedRecipes.includes(recipe.id.toString())"
                      @change="toggleSelect(recipe.id.toString())"
                      class="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                    >
                    <div class="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        v-if="recipe.imageUrl"
                        :src="recipe.imageUrl"
                        :alt="recipe.title"
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center">
                        <span class="text-2xl">🍽️</span>
                      </div>
                    </div>
                    <div>
                      <NuxtLink
                        :to="localePath(`/admin/recipes/${recipe.id}/edit`, locale)"
                        class="text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors"
                      >
                        {{ recipe.title }}
                      </NuxtLink>
                      <p v-if="recipe.description" class="text-sm text-gray-600 line-clamp-1 mt-1">
                        {{ recipe.description }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    {{ recipe.category }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-semibold uppercase',
                      difficultyColor(recipe.difficulty)
                    ]"
                  >
                    {{ difficultyLabel(recipe.difficulty) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }} {{ t('recipe.min') }}
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <NuxtLink
                      :to="localePath(`/admin/recipes/${recipe.id}/edit`, locale)"
                      class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      :title="t('common.edit')"
                    >
                      ✏️
                    </NuxtLink>
                    <button
                      @click="handleDelete(recipe.id)"
                      class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      :title="t('common.delete')"
                      :aria-label="t('common.delete')"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Mobile Card List -->
          <div class="md:hidden divide-y divide-gray-200">
            <div
              v-for="recipe in recipes"
              :key="recipe.id"
              class="p-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  :checked="selectedRecipes.includes(recipe.id.toString())"
                  @change="toggleSelect(recipe.id.toString())"
                  class="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-orange-500 flex-shrink-0"
                >
                <div class="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    v-if="recipe.imageUrl"
                    :src="recipe.imageUrl"
                    :alt="recipe.title"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <span class="text-2xl">🍽️</span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <NuxtLink
                    :to="localePath(`/admin/recipes/${recipe.id}/edit`, locale)"
                    class="block font-semibold text-gray-900 hover:text-orange-600 transition-colors truncate"
                  >
                    {{ recipe.title }}
                  </NuxtLink>
                  <div class="flex flex-wrap items-center gap-2 mt-1">
                    <span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {{ recipe.category }}
                    </span>
                    <span
                      :class="[
                        'px-2 py-0.5 rounded-full text-xs font-semibold uppercase',
                        difficultyColor(recipe.difficulty)
                      ]"
                    >
                      {{ difficultyLabel(recipe.difficulty) }}
                    </span>
                    <span class="text-xs text-gray-500">
                      {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }}{{ t('recipe.min') }}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col gap-1 flex-shrink-0">
                  <NuxtLink
                    :to="localePath(`/admin/recipes/${recipe.id}/edit`, locale)"
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    :title="t('common.edit')"
                  >
                    ✏️
                  </NuxtLink>
                  <button
                    @click="handleDelete(recipe.id)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    :title="t('common.delete')"
                    :aria-label="t('common.delete')"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
