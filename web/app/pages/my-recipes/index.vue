<script setup lang="ts">
/**
 * My Recipes Page - 我的食谱页面
 *
 * 显示当前用户创建的所有食谱，支持编辑和删除
 */
import type { RecipeListItem } from '~/types'
import PlusIcon from '~/components/icons/PlusIcon.vue'
import ChevronLeftIcon from '~/components/icons/ChevronLeftIcon.vue'
import TimerIcon from '~/components/icons/TimerIcon.vue'
import UsersIcon from '~/components/icons/UsersIcon.vue'
import PencilIcon from '~/components/icons/PencilIcon.vue'
import TrashIcon from '~/components/icons/TrashIcon.vue'

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const { user } = useAuth()
const { deleteRecipe } = useRecipeMutations()
const { show: showToast } = useToast()

// Recipe queries state
const recipes = shallowRef<RecipeListItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const hasMore = ref(true)
const currentPage = ref(0)
const deletingId = ref<string | null>(null)

const PAGE_SIZE = 20

useSeoMeta({
  title: () => `${t('myRecipes.title')} - ${t('app.title')}`,
  description: () => t('myRecipes.description'),
})

const fetchMyRecipes = async (append = false) => {
  if (!user.value?.id) {
    error.value = t('myRecipes.notLoggedIn')
    return []
  }

  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
    currentPage.value = 0
    hasMore.value = true
  }
  error.value = null

  try {
    const page = append ? currentPage.value + 1 : 0
    const params: Record<string, string> = {
      page: String(page + 1),
      limit: String(PAGE_SIZE),
      author_id: user.value.id,
    }

    const response = await $fetch<{ data?: Record<string, unknown>[]; count?: number }>('/api/recipes', { params })

    const newRecipes = (response?.data || []).map((recipe) => ({
      id: recipe.id as string,
      title: recipe.title as string,
      imageUrl: (recipe.image_url || recipe.imageUrl) as string | undefined,
      prepTimeMinutes: (recipe.prep_time_minutes || recipe.prepTimeMinutes || 0) as number,
      cookTimeMinutes: (recipe.cook_time_minutes || recipe.cookTimeMinutes || 0) as number,
      servings: (recipe.servings || 0) as number,
      views: (recipe.views || 0) as number,
      cookingCount: (recipe.cooking_count || recipe.cookingCount || 0) as number,
      created_at: (recipe.created_at || recipe.createdAt) as string | undefined,
      averageRating: (recipe.average_rating || recipe.averageRating || 0) as number,
      ratingCount: (recipe.rating_count || recipe.ratingCount || 0) as number,
      nutritionInfo: (recipe.nutrition_info || recipe.nutritionInfo) as RecipeListItem['nutritionInfo'],
    }))

    if (append) {
      recipes.value = [...recipes.value, ...newRecipes]
    } else {
      recipes.value = newRecipes
    }

    const total = response?.count || 0
    hasMore.value = recipes.value.length < total
    if (hasMore.value) {
      currentPage.value = page
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t('myRecipes.fetchError')
  } finally {
    loading.value = false
    loadingMore.value = false
  }

  return recipes.value
}

const loadMore = () => {
  if (!loadingMore.value && hasMore.value) {
    fetchMyRecipes(true)
  }
}

const handleRetry = () => {
  fetchMyRecipes(false)
}

// Handle recipe edit
const handleEdit = (recipeId: string) => {
  router.push(localePath(`/recipes/${recipeId}/edit`))
}

// Handle recipe delete
const handleDelete = async (recipeId: string) => {
  if (!confirm(t('myRecipes.confirmDelete'))) return

  deletingId.value = recipeId
  try {
    const success = await deleteRecipe(recipeId)
    if (success) {
      showToast(t('myRecipes.deleted'), 'success')
      recipes.value = recipes.value.filter(r => r.id !== recipeId)
    } else {
      showToast(t('myRecipes.deleteFailed'), 'error')
    }
  } finally {
    deletingId.value = null
  }
}

// Navigate to create new recipe
const handleCreate = () => {
  router.push(localePath('/recipes/new'))
}

// Navigate to explore
const handleExplore = () => {
  router.push(localePath('/'))
}

// Redirect to login if not authenticated
onMounted(async () => {
  if (!user.value) {
    await navigateTo(localePath('/login'))
    return
  }
  fetchMyRecipes(false)
})

watch(() => user.value?.id, (newId) => {
  if (newId) {
    fetchMyRecipes(false)
  }
})
</script>

<template>
  <div class="min-h-screen pb-16 md:pb-0 bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
    <header class="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-stone-700 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <NuxtLink
              :to="localePath('/')"
              class="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
              :aria-label="t('nav.backToHome')"
            >
              <ChevronLeftIcon class="w-5 h-5 text-gray-600 dark:text-stone-300" aria-hidden="true" />
            </NuxtLink>
            <h1 class="text-2xl font-bold text-stone-900 dark:text-white">
              {{ t('myRecipes.title') }}
            </h1>
          </div>
          <div class="flex items-center gap-2">
            <RecipeImportExport />
            <button
              @click="handleCreate"
              class="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
            >
              <PlusIcon class="w-5 h-5" />
              {{ t('myRecipes.createFirst') }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Loading state -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="i in 8" :key="i" class="animate-pulse">
          <div class="bg-gray-200 dark:bg-stone-700 rounded-xl h-48 mb-3" />
          <div class="bg-gray-200 dark:bg-stone-700 h-4 rounded w-3/4 mb-2" />
          <div class="bg-gray-200 dark:bg-stone-700 h-3 rounded w-1/2" />
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-500 mb-4">{{ error }}</p>
        <button
          class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          @click="handleRetry"
        >
          {{ t('common.retry') }}
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="recipes.length === 0" class="text-center py-12">
        <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-stone-700 rounded-full flex items-center justify-center text-4xl">
          🍳
        </div>
        <p class="text-gray-500 dark:text-stone-400 mb-2">{{ t('myRecipes.empty') }}</p>
        <div class="flex gap-3 justify-center mt-4">
          <button
            @click="handleCreate"
            class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {{ t('myRecipes.createFirst') }}
          </button>
          <button
            @click="handleExplore"
            class="px-4 py-2 bg-gray-200 dark:bg-stone-700 text-gray-700 dark:text-stone-300 rounded-lg hover:bg-gray-300 dark:hover:bg-stone-600 transition-colors"
          >
            {{ t('myRecipes.explore') || 'Explore Recipes' }}
          </button>
        </div>
      </div>

      <!-- Recipe grid -->
      <div v-else>
        <p class="text-sm text-gray-500 dark:text-stone-400 mb-4">
          {{ t('myRecipes.total', { count: recipes.length }) }}
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="recipe in recipes"
            :key="recipe.id"
            v-memo="[recipe.id, recipe.title, recipe.imageUrl, recipe.prepTimeMinutes, recipe.cookTimeMinutes, recipe.servings, deletingId === recipe.id]"
            class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow group"
          >
            <!-- Recipe image -->
            <NuxtLink :to="localePath(`/recipes/${recipe.id}`)" class="block">
              <div class="aspect-[4/3] bg-gray-100 dark:bg-stone-700 relative overflow-hidden">
                <AppImage
                  v-if="recipe.imageUrl"
                  :src="recipe.imageUrl"
                  :alt="recipe.title"
                  class="w-full h-full group-hover:scale-105 transition-transform duration-300"
                  sizes="sm:100vw md:50vw lg:400px"
                  object-fit="cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-4xl" aria-label="No image">
                  <span aria-hidden="true">🍽️</span>
                </div>
                <!-- Hover overlay -->
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <span class="px-3 py-1 bg-white/90 rounded-lg text-sm font-medium text-stone-900 opacity-0 group-hover:opacity-100 transition-opacity">
                    {{ t('common.view') || 'View' }}
                  </span>
                </div>
              </div>
            </NuxtLink>

            <!-- Recipe info -->
            <div class="p-4">
              <NuxtLink :to="localePath(`/recipes/${recipe.id}`)">
                <h3 class="font-semibold text-stone-900 dark:text-white line-clamp-1 hover:text-orange-500 transition-colors">
                  {{ recipe.title }}
                </h3>
              </NuxtLink>

              <div class="flex items-center gap-3 mt-2 text-sm text-stone-500 dark:text-stone-400">
                <span class="flex items-center gap-1">
                  <TimerIcon class="w-4 h-4" />
                  {{ (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0) }}{{ t('units.minutes') || 'min' }}
                </span>
                <span class="flex items-center gap-1">
                  <UsersIcon class="w-4 h-4" />
                  {{ recipe.servings || 0 }}
                </span>
              </div>

              <!-- Action buttons -->
              <div class="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-stone-700">
                <button
                  @click="handleEdit(recipe.id)"
                  class="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                >
                  <PencilIcon class="w-4 h-4" aria-hidden="true" />
                  {{ t('myRecipes.editRecipe') }}
                </button>
                <button
                  @click="handleDelete(recipe.id)"
                  :disabled="deletingId === recipe.id"
                  class="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <TrashIcon v-if="deletingId !== recipe.id" class="w-4 h-4" aria-hidden="true" />
                  <div v-else class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                  {{ t('myRecipes.deleteRecipe') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Load more -->
        <div v-if="hasMore" class="mt-8 text-center">
          <button
            class="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? t('common.loading') : t('common.loadMore') }}
          </button>
        </div>
      </div>
    </main>

    <LazyBottomNav />
  </div>
</template>
