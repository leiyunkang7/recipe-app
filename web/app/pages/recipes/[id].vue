<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes'
import type { Recipe } from '~/types'

const { t, locale } = useI18n()
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

// 移动端检测
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

// 食材勾选状态
const selectedIngredients = ref<string[]>([])

// 收藏状态
const isFavorite = ref(false)

// 当前步骤
const currentStep = ref(0)

// 移动端侧边栏展开状态
const showSidebar = ref(false)

// 步骤展开更多
const expandedSteps = ref<Set<number>>(new Set())

const toggleStepExpand = (index: number) => {
  if (expandedSteps.value.has(index)) {
    expandedSteps.value.delete(index)
  } else {
    expandedSteps.value.add(index)
  }
  expandedSteps.value = new Set(expandedSteps.value)
}

const difficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
    case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
    case 'hard': return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
    default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
  }
}

const difficultyLabel = (difficulty: string) => {
  return t(`difficulty.${difficulty}`)
}

const totalTime = computed(() => {
  if (!recipe.value) return 0
  const prep = Number(recipe.value.prepTimeMinutes) || 0
  const cook = Number(recipe.value.cookTimeMinutes) || 0
  return prep + cook
})

// 切换收藏
const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
}

// 营养信息（模拟数据）
const nutritionInfo = computed(() => ({
  calories: Math.floor(Math.random() * 300) + 200,
  protein: Math.floor(Math.random() * 30) + 10,
  carbs: Math.floor(Math.random() * 40) + 20,
  fat: Math.floor(Math.random() * 20) + 5,
}))

// 计算已选食材数量
const selectedCount = computed(() => selectedIngredients.value.length)
const totalIngredients = computed(() => recipe.value?.ingredients.length || 0)
</script>

<template>
  <div class="min-h-screen bg-stone-50 dark:bg-stone-900 pb-20 lg:pb-8 transition-colors duration-300">
    <!-- 移动端顶部导航 -->
    <header class="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-stone-800/95 backdrop-blur-md shadow-sm">
      <div class="flex items-center justify-between px-4 py-3">
        <NuxtLink
          :to="localePath('/', locale)"
          class="inline-flex items-center gap-1.5 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors text-sm font-medium"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          {{ t('common.back') }}
        </NuxtLink>
        
        <div class="flex items-center gap-2">
          <button 
            @click="toggleFavorite"
            class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors active:scale-95 touch-manipulation"
            :aria-label="isFavorite ? '取消收藏' : '收藏'"
          >
            <span class="text-xl transition-transform" :class="isFavorite ? 'scale-110' : ''">{{ isFavorite ? '❤️' : '🤍' }}</span>
          </button>
          <LanguageSwitcher />
        </div>
      </div>
    </header>

    <!-- 桌面端导航 -->
    <header class="hidden lg:block bg-white dark:bg-stone-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <NuxtLink
            :to="localePath('/', locale)"
            class="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
          >
            ← {{ t('common.back') }}
          </NuxtLink>
          <LanguageSwitcher />
        </div>
      </div>
    </header>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>

    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-300">{{ error }}</p>
      </div>
    </div>

    <div v-else-if="recipe">
      <!-- 移动端：单列布局 -->
      <div class="lg:hidden">
        <!-- 主图 -->
        <div class="relative h-56 sm:h-72 bg-gradient-to-br from-orange-100 dark:from-orange-900 to-orange-200 dark:to-orange-800">
          <img
            v-if="recipe.imageUrl"
            :src="recipe.imageUrl"
            :alt="recipe.title"
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="text-7xl">🍽️</span>
          </div>
          <!-- 渐变遮罩 -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        </div>

        <!-- 内容区域 -->
        <div class="px-4 -mt-6 relative">
          <!-- 标题卡片 -->
          <div class="bg-white dark:bg-stone-800 rounded-t-3xl shadow-lg p-5">
            <div class="flex items-start justify-between gap-2 mb-3">
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-stone-100 leading-tight flex-1 min-w-0">
                {{ recipe.title }}
              </h1>
              <span
                :class="[
                  'px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold uppercase shrink-0',
                  difficultyColor(recipe.difficulty)
                ]"
              >
                {{ difficultyLabel(recipe.difficulty) }}
              </span>
            </div>
            
            <p v-if="recipe.description" class="text-gray-600 dark:text-stone-400 text-sm mb-4 line-clamp-2">
              {{ recipe.description }}
            </p>

            <!-- 快速信息 -->
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

        <!-- 食材列表 -->
        <div class="px-4 mt-4">
          <div class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm p-4">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-lg font-bold text-gray-900 dark:text-stone-100 flex items-center gap-2">
                🛒 {{ t('recipe.ingredients') }}
              </h2>
              <span v-if="totalIngredients > 0" class="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
                {{ selectedCount }}/{{ totalIngredients }}
              </span>
            </div>
            <ul class="space-y-2">
              <li
                v-for="ingredient in recipe.ingredients"
                :key="ingredient.name"
                class="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                :class="selectedIngredients.includes(ingredient.name) ? 'bg-green-50 dark:bg-green-900/20 line-through opacity-60' : 'bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600'"
                @click="selectedIngredients.includes(ingredient.name) ? selectedIngredients = selectedIngredients.filter(i => i !== ingredient.name) : selectedIngredients.push(ingredient.name)"
              >
                <div 
                  class="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                  :class="selectedIngredients.includes(ingredient.name) ? 'bg-green-500 text-white' : 'border-2 border-gray-300 dark:border-stone-500'"
                >
                  <svg v-if="selectedIngredients.includes(ingredient.name)" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span class="flex-1 text-sm font-medium" :class="selectedIngredients.includes(ingredient.name) ? 'text-gray-400' : 'text-gray-900 dark:text-stone-100'">
                  {{ ingredient.name }}
                </span>
                <span class="text-xs" :class="selectedIngredients.includes(ingredient.name) ? 'text-gray-400' : 'text-gray-600 dark:text-stone-400'">
                  {{ ingredient.amount }} {{ ingredient.unit }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 步骤列表 -->
        <div class="px-4 mt-4 mb-6">
          <div class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm p-4">
            <h2 class="text-lg font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              📝 {{ t('recipe.instructions') }}
            </h2>
            <ol class="space-y-3">
              <li
                v-for="(step, index) in recipe.steps"
                :key="index"
                class="flex gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer"
                :class="currentStep === index ? 'bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-500 dark:border-orange-600 shadow-md' : 'hover:bg-stone-50 dark:hover:bg-stone-700 border-2 border-transparent'"
                @click="currentStep = index"
              >
                <span 
                  class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  :class="currentStep === index ? 'bg-orange-500 text-white' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'"
                >
                  {{ index + 1 }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-gray-900 dark:text-stone-100 text-sm leading-relaxed" :class="{ 'line-clamp-3': !expandedSteps.has(index) && currentStep !== index }">
                    {{ step.instruction }}
                  </p>
                  <p v-if="step.durationMinutes" class="text-xs text-gray-500 dark:text-stone-400 mt-1.5 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ t('recipe.duration') }}: {{ step.durationMinutes }} {{ t('recipe.min') }}
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <!-- 标签 -->
        <div v-if="recipe.tags && recipe.tags.length > 0" class="px-4 pb-6">
          <div class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm p-4">
            <h2 class="text-lg font-bold text-gray-900 dark:text-stone-100 mb-3 flex items-center gap-2">
              🏷️ {{ t('recipe.tags') }}
            </h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in recipe.tags"
                :key="tag"
                class="px-3 py-1.5 bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 桌面端：原有布局 -->
      <div class="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md dark:shadow-stone-900/30 overflow-hidden">
              <div class="relative h-96 bg-gradient-to-br from-orange-100 dark:from-orange-900 to-orange-200 dark:to-orange-800">
                <img
                  v-if="recipe.imageUrl"
                  :src="recipe.imageUrl"
                  :alt="recipe.title"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <span class="text-9xl">🍽️</span>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md dark:shadow-stone-900/30 p-6">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h1 class="text-3xl font-bold text-gray-900 dark:text-stone-100 mb-2">{{ recipe.title }}</h1>
                  <p v-if="recipe.description" class="text-gray-600 dark:text-stone-400">{{ recipe.description }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <button 
                    @click="toggleFavorite"
                    class="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    <span class="text-2xl">{{ isFavorite ? '❤️' : '🤍' }}</span>
                  </button>
                  <span
                    :class="[
                      'px-3 py-1 rounded-full text-sm font-semibold uppercase',
                      difficultyColor(recipe.difficulty)
                    ]"
                  >
                    {{ difficultyLabel(recipe.difficulty) }}
                  </span>
                </div>
              </div>

              <!-- 营养信息卡片 -->
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

            <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md dark:shadow-stone-900/30 p-6">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                🛒 {{ t('recipe.ingredients') }}
              </h2>
              <ul class="space-y-3">
                <li
                  v-for="ingredient in recipe.ingredients"
                  :key="ingredient.name"
                  class="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer"
                  :class="selectedIngredients.includes(ingredient.name) ? 'bg-green-50 dark:bg-green-900/20 line-through opacity-60' : 'bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600'"
                  @click="selectedIngredients.includes(ingredient.name) ? selectedIngredients = selectedIngredients.filter(i => i !== ingredient.name) : selectedIngredients.push(ingredient.name)"
                >
                  <input 
                    type="checkbox" 
                    :checked="selectedIngredients.includes(ingredient.name)"
                    class="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                  >
                  <span class="flex-1 font-medium" :class="selectedIngredients.includes(ingredient.name) ? 'text-gray-400' : 'text-gray-900 dark:text-stone-100'">{{ ingredient.name }}</span>
                  <span class="text-sm" :class="selectedIngredients.includes(ingredient.name) ? 'text-gray-400' : 'text-gray-600 dark:text-stone-400'">
                    {{ ingredient.amount }} {{ ingredient.unit }}
                  </span>
                </li>
              </ul>
            </div>

            <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md dark:shadow-stone-900/30 p-6">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                📝 {{ t('recipe.instructions') }}
              </h2>
              <ol class="space-y-4">
                <li
                  v-for="(step, index) in recipe.steps"
                  :key="index"
                  class="flex gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200"
                  :class="currentStep === index ? 'bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-500 dark:border-orange-600 shadow-md' : 'hover:bg-stone-50 dark:hover:bg-stone-700'"
                  @click="currentStep = index"
                >
                  <span 
                    class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                    :class="currentStep === index ? 'bg-orange-500 text-white' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'"
                  >
                    {{ index + 1 }}
                  </span>
                  <div class="flex-1">
                    <p class="text-gray-900 dark:text-stone-100 leading-relaxed">{{ step.instruction }}</p>
                    <p v-if="step.durationMinutes" class="text-sm text-gray-500 dark:text-stone-400 mt-2">
                      ⏱️ {{ t('recipe.duration') }}: {{ step.durationMinutes }} {{ t('recipe.min') }}
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <div v-if="recipe.tags && recipe.tags.length > 0" class="bg-white dark:bg-stone-800 rounded-xl shadow-md dark:shadow-stone-900/30 p-6">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                🏷️ {{ t('recipe.tags') }}
              </h2>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in recipe.tags"
                  :key="tag"
                  class="px-3 py-2 bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- 桌面端侧边栏 -->
          <div class="space-y-6">
            <div v-if="recipe.nutritionInfo" class="bg-white rounded-xl shadow-md p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                🥗 {{ t('recipe.nutritionInfo') }}
              </h2>
              <div class="grid grid-cols-2 gap-4">
                <div v-if="recipe.nutritionInfo.calories" class="text-center p-3 bg-red-50 rounded-lg">
                  <p class="text-2xl mb-1">🔥</p>
                  <p class="text-xs text-gray-600">{{ t('recipe.calories') }}</p>
                  <p class="font-semibold text-gray-900">{{ recipe.nutritionInfo.calories }}</p>
                </div>
                <div v-if="recipe.nutritionInfo.protein" class="text-center p-3 bg-blue-50 rounded-lg">
                  <p class="text-2xl mb-1">💪</p>
                  <p class="text-xs text-gray-600">{{ t('recipe.protein') }}</p>
                  <p class="font-semibold text-gray-900">{{ recipe.nutritionInfo.protein }}g</p>
                </div>
                <div v-if="recipe.nutritionInfo.carbs" class="text-center p-3 bg-yellow-50 rounded-lg">
                  <p class="text-2xl mb-1">🍞</p>
                  <p class="text-xs text-gray-600">{{ t('recipe.carbs') }}</p>
                  <p class="font-semibold text-gray-900">{{ recipe.nutritionInfo.carbs }}g</p>
                </div>
                <div v-if="recipe.nutritionInfo.fat" class="text-center p-3 bg-purple-50 rounded-lg">
                  <p class="text-2xl mb-1">🧈</p>
                  <p class="text-xs text-gray-600">{{ t('recipe.fat') }}</p>
                  <p class="font-semibold text-gray-900">{{ recipe.nutritionInfo.fat }}g</p>
                </div>
                <div v-if="recipe.nutritionInfo.fiber" class="text-center p-3 bg-green-50 rounded-lg col-span-2">
                  <p class="text-2xl mb-1">🌾</p>
                  <p class="text-xs text-gray-600">{{ t('recipe.fiber') }}</p>
                  <p class="font-semibold text-gray-900">{{ recipe.nutritionInfo.fiber }}g</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-md p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4">{{ t('recipe.quickInfo') }}</h2>
              <div class="space-y-3">
                <div v-if="recipe.category" class="flex justify-between">
                  <span class="text-gray-600">{{ t('recipe.category') }}</span>
                  <span class="font-semibold text-gray-900">{{ recipe.category }}</span>
                </div>
                <div v-if="recipe.cuisine" class="flex justify-between">
                  <span class="text-gray-600">{{ t('recipe.cuisine') }}</span>
                  <span class="font-semibold text-gray-900">{{ recipe.cuisine }}</span>
                </div>
                <div v-if="recipe.source" class="flex justify-between">
                  <span class="text-gray-600">{{ t('recipe.source') }}</span>
                  <a
                    v-if="recipe.source.startsWith('http')"
                    :href="recipe.source"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-semibold text-orange-600 hover:text-orange-700"
                  >
                    {{ t('recipe.viewSource') }} →
                  </a>
                  <span v-else class="font-semibold text-gray-900">{{ recipe.source }}</span>
                </div>
              </div>
            </div>
          </div>
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

/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 触摸优化 */
@media (hover: none) {
  .touch-manipulation {
    touch-action: manipulation;
  }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
