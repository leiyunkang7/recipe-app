<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes'
import type { Recipe } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { fetchRecipeById, incrementViews, loading, error } = useRecipes()

const recipe = ref<Recipe | null>(null)
const pageTitle = computed(() => 
  recipe.value ? `${recipe.value.title} - ${t('app.title')}` : t('app.title')
)

useSeoMeta({
  title: pageTitle,
  ogTitle: pageTitle,
})

// Mobile detection
const isMobile = ref(true)
const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
}

onMounted(async () => {
  recipe.value = await fetchRecipeById(route.params.id as string)
  if (recipe.value) {
    incrementViews(route.params.id as string)
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

watch(() => useI18n().locale.value, async () => {
  recipe.value = await fetchRecipeById(route.params.id as string)
})

// Ingredient selection state
const selectedIngredients = ref<string[]>([])

// Favorite state
const isFavorite = ref(false)

// Current step
const currentStep = ref(0)

// Step expansion
const expandedSteps = ref<Set<number>>(new Set())

const toggleIngredient = (name: string) => {
  if (selectedIngredients.value.includes(name)) {
    selectedIngredients.value = selectedIngredients.value.filter(i => i !== name)
  } else {
    selectedIngredients.value.push(name)
  }
}

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
}

const toggleStepExpand = (index: number) => {
  if (expandedSteps.value.has(index)) {
    expandedSteps.value.delete(index)
  } else {
    expandedSteps.value.add(index)
  }
  expandedSteps.value = new Set(expandedSteps.value)
}

// Computed
const difficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
    case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
    case 'hard': return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
    default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
  }
}

const difficultyLabel = (difficulty: string) => t(`difficulty.${difficulty}`)

const totalTime = computed(() => {
  if (!recipe.value) return 0
  const prep = Number(recipe.value.prepTimeMinutes) || 0
  const cook = Number(recipe.value.cookTimeMinutes) || 0
  return prep + cook
})

const nutritionInfo = computed(() => ({
  calories: Math.floor(Math.random() * 300) + 200,
  protein: Math.floor(Math.random() * 30) + 10,
  carbs: Math.floor(Math.random() * 40) + 20,
  fat: Math.floor(Math.random() * 20) + 5,
}))
</script>

<template>
  <div class="min-h-screen bg-stone-50 dark:bg-stone-900 pb-20 lg:pb-8 transition-colors duration-300">
    <!-- Header -->
    <RecipeDetailHeader :is-favorite="isFavorite" @toggle-favorite="toggleFavorite" />

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-300">{{ error }}</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="recipe">
      <!-- Mobile Layout -->
      <div class="lg:hidden">
        <!-- Hero -->
        <RecipeDetailHero :recipe="recipe" />

        <!-- Title Card -->
        <div class="px-4 -mt-6 relative">
          <div class="bg-white dark:bg-stone-800 rounded-t-3xl shadow-lg p-5">
            <div class="flex items-start justify-between gap-2 mb-3">
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-stone-100 leading-tight flex-1 min-w-0">
                {{ recipe.title }}
              </h1>
              <span :class="['px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold uppercase shrink-0', difficultyColor(recipe.difficulty)]">
                {{ difficultyLabel(recipe.difficulty) }}
              </span>
            </div>
            
            <p v-if="recipe.description" class="text-gray-600 dark:text-stone-400 text-sm mb-4 line-clamp-2">
              {{ recipe.description }}
            </p>

            <!-- Quick Info Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-4">
              <div class="text-center p-1.5 sm:p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                <p class="text-base sm:text-lg mb-0.5">⏱️</p>
                <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.totalTime') }}</p>
                <p class="font-semibold text-gray-900 dark:text-stone-100 text-xs sm:text-sm">{{ totalTime }}{{ t('recipe.min') }}</p>
              </div>
              <div class="text-center p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <p class="text-base sm:text-lg mb-0.5">👥</p>
                <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.servings') }}</p>
                <p class="font-semibold text-gray-900 dark:text-stone-100 text-xs sm:text-sm">{{ recipe.servings }}</p>
              </div>
              <div class="text-center p-1.5 sm:p-2 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <p class="text-base sm:text-lg mb-0.5">🥬</p>
                <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.prep') }}</p>
                <p class="font-semibold text-gray-900 dark:text-stone-100 text-xs sm:text-sm">{{ recipe.prepTimeMinutes }}{{ t('recipe.min') }}</p>
              </div>
              <div class="text-center p-1.5 sm:p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <p class="text-base sm:text-lg mb-0.5">🍳</p>
                <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.cook') }}</p>
                <p class="font-semibold text-gray-900 dark:text-stone-100 text-xs sm:text-sm">{{ recipe.cookTimeMinutes }}{{ t('recipe.min') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Ingredients -->
        <div class="px-4 mt-4">
          <RecipeDetailIngredients
            :recipe="recipe"
            :selected-ingredients="selectedIngredients"
            :is-mobile="true"
            @toggle-ingredient="toggleIngredient"
          />
        </div>

        <!-- Steps -->
        <div class="px-4 mt-4 mb-6">
          <RecipeDetailSteps
            :recipe="recipe"
            :current-step="currentStep"
            :is-mobile="true"
            :expanded-steps="expandedSteps"
            @update:current-step="currentStep = $event"
            @toggle-expand="toggleStepExpand"
          />
        </div>

        <!-- Tags -->
        <div v-if="recipe.tags && recipe.tags.length > 0" class="px-4 pb-6">
          <RecipeDetailTags :tags="recipe.tags" :is-mobile="true" />
        </div>
      </div>

      <!-- Desktop Layout -->
      <div class="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Hero -->
            <RecipeDetailHero :recipe="recipe" />

            <!-- Title Section -->
            <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md dark:shadow-stone-900/30 p-6">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h1 class="text-3xl font-bold text-gray-900 dark:text-stone-100 mb-2">{{ recipe.title }}</h1>
                  <p v-if="recipe.description" class="text-gray-600 dark:text-stone-400">{{ recipe.description }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <button @click="toggleFavorite" class="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
                    <span class="text-2xl">{{ isFavorite ? '❤️' : '🤍' }}</span>
                  </button>
                  <span :class="['px-3 py-1 rounded-full text-sm font-semibold uppercase', difficultyColor(recipe.difficulty)]">
                    {{ difficultyLabel(recipe.difficulty) }}
                  </span>
                </div>
              </div>

              <!-- Nutrition Card -->
              <div class="bg-gradient-to-r from-orange-50 dark:from-orange-900/30 to-amber-50 dark:to-amber-900/30 rounded-xl p-4 mb-6">
                <h3 class="text-sm font-semibold text-gray-600 dark:text-stone-400 mb-3">📊 营养信息</h3>
                <div class="grid grid-cols-4 gap-2 text-center">
                  <div class="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-sm">
                    <div class="text-lg font-bold text-orange-600 dark:text-orange-400">{{ nutritionInfo.calories }}</div>
                    <div class="text-xs text-gray-500 dark:text-stone-400">卡路里</div>
                  </div>
                  <div class="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-sm">
                    <div class="text-lg font-bold text-green-600 dark:text-green-400">{{ nutritionInfo.protein }}g</div>
                    <div class="text-xs text-gray-500 dark:text-stone-400">蛋白质</div>
                  </div>
                  <div class="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-sm">
                    <div class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ nutritionInfo.carbs }}g</div>
                    <div class="text-xs text-gray-500 dark:text-stone-400">碳水</div>
                  </div>
                  <div class="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-sm">
                    <div class="text-lg font-bold text-yellow-600 dark:text-yellow-400">{{ nutritionInfo.fat }}g</div>
                    <div class="text-xs text-gray-500 dark:text-stone-400">脂肪</div>
                  </div>
                </div>
              </div>

              <!-- Quick Info Grid -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div class="text-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                  <p class="text-2xl mb-1">⏱️</p>
                  <p class="text-sm text-gray-600 dark:text-stone-400">{{ t('recipe.totalTime') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-stone-100">{{ totalTime }} {{ t('recipe.min') }}</p>
                </div>
                <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p class="text-2xl mb-1">👥</p>
                  <p class="text-sm text-gray-600 dark:text-stone-400">{{ t('recipe.servings') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.servings }}</p>
                </div>
                <div class="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <p class="text-2xl mb-1">🥬</p>
                  <p class="text-sm text-gray-600 dark:text-stone-400">{{ t('recipe.prep') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.prepTimeMinutes }} {{ t('recipe.min') }}</p>
                </div>
                <div class="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <p class="text-2xl mb-1">🍳</p>
                  <p class="text-sm text-gray-600 dark:text-stone-400">{{ t('recipe.cook') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.cookTimeMinutes }} {{ t('recipe.min') }}</p>
                </div>
              </div>
            </div>

            <!-- Ingredients -->
            <RecipeDetailIngredients
              :recipe="recipe"
              :selected-ingredients="selectedIngredients"
              :is-mobile="false"
              @toggle-ingredient="toggleIngredient"
            />

            <!-- Steps -->
            <RecipeDetailSteps
              :recipe="recipe"
              :current-step="currentStep"
              :is-mobile="false"
              :expanded-steps="expandedSteps"
              @update:current-step="currentStep = $event"
              @toggle-expand="toggleStepExpand"
            />

            <!-- Tags -->
            <RecipeDetailTags v-if="recipe.tags && recipe.tags.length > 0" :tags="recipe.tags" :is-mobile="false" />
          </div>

          <!-- Sidebar -->
          <RecipeDetailSidebar :recipe="recipe" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

html {
  scroll-behavior: smooth;
}

@media (hover: none) {
  .touch-manipulation {
    touch-action: manipulation;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
