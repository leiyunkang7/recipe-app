<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { recipes, loading, error, fetchRecipes, deleteRecipe } = useRecipes()

const searchQuery = ref('')

onMounted(async () => {
  await fetchRecipes()
})

watch(searchQuery, async () => {
  if (searchQuery.value) {
    await fetchRecipes({ search: searchQuery.value })
  } else {
    await fetchRecipes()
  }
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
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              📋 {{ t('admin.title') }}
            </h1>
            <p class="text-sm text-gray-600 mt-1">{{ t('admin.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-3">
            <LanguageSwitcher />
            <NuxtLink
              :to="localePath('/', locale)"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {{ t('nav.viewSite') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/admin/recipes/new', locale)"
              class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <span>+</span> {{ t('admin.addRecipe') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div v-else class="overflow-x-auto">
          <table class="w-full">
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
                    <div class="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        v-if="recipe.imageUrl"
                        :src="recipe.imageUrl"
                        :alt="recipe.title"
                        class="w-full h-full object-cover"
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
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
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
