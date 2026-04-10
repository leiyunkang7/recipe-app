<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipe: Recipe
}>()

const emit = defineEmits<{
  share: []
}>()

const { t } = useI18n()
const { calculatePerServingNutrition, getKnownIngredientsSummary } = useNutritionCalculator()

// Nutrition calculation - use stored nutritionInfo or calculate from ingredients
const nutritionData = computed(() => {
  const info = props.recipe.nutritionInfo
  const servings = props.recipe.servings || 1
  
  // If we have nutrition info, calculate per-serving values
  if (info?.calories || info?.protein || info?.carbs || info?.fat || info?.fiber) {
    const hasStoredNutrition = !!info?.calories
    return {
      calories: info?.calories ? Math.round(info.calories / servings) : undefined,
      protein: info?.protein ? Math.round(info.protein / servings * 10) / 10 : undefined,
      carbs: info?.carbs ? Math.round(info.carbs / servings * 10) / 10 : undefined,
      fat: info?.fat ? Math.round(info.fat / servings * 10) / 10 : undefined,
      fiber: info?.fiber ? Math.round(info.fiber / servings * 10) / 10 : undefined,
      isCalculated: false,
      hasData: true,
      label: t('recipe.perServing'),
    }
  }
  
  // Calculate from ingredients
  if (props.recipe.ingredients && props.recipe.ingredients.length > 0) {
    const calculated = calculatePerServingNutrition(props.recipe.ingredients, servings)
    const { known, unknown } = getKnownIngredientsSummary(props.recipe.ingredients)
    return {
      ...calculated,
      isCalculated: true,
      hasData: true,
      label: t('recipe.calculated'),
      knownCount: known.length,
      totalCount: props.recipe.ingredients.length,
      hasPartialData: unknown.length > 0,
    }
  }
  
  return {
    hasData: false,
    isCalculated: false,
    label: '',
  }
})

// Consolidate nutrition flags into single computed object to reduce overhead
const nutrition = computed(() => {
  const data = nutritionData.value
  return {
    hasInfo: data.hasData,
    hasCalories: !!data.calories,
    hasProtein: !!data.protein,
    hasCarbs: !!data.carbs,
    hasFat: !!data.fat,
    hasFiber: !!data.fiber,
  }
})

// Recipe stats state
const statsLoading = ref(false)
const statsData = ref({
  views: 0,
  favoritesCount: 0,
  cookingCount: 0,
})

// Fetch recipe stats
const fetchStats = async () => {
  if (!props.recipe?.id) return
  statsLoading.value = true
  try {
    const data = await $fetch(`/api/v1/recipes/${props.recipe.id}/stats`)
    if (data?.data) {
      statsData.value = data.data
    }
  } catch {
    // Use fallback values from recipe
    statsData.value = {
      views: props.recipe.views || 0,
      favoritesCount: 0,
      cookingCount: props.recipe.cookingCount || 0,
    }
  } finally {
    statsLoading.value = false
  }
}

// Subscription handling
const { isAuthenticated } = useAuth()
const {
  isSubscribed,
  isLoading,
  subscriptionError,
  subscribe,
  unsubscribe,
  checkSubscription,
} = useRecipeSubscription()

// Anonymous email subscription
const {
  email: emailInput,
  isLoading: emailSubscriptionLoading,
  message: emailSubscriptionMessage,
  error: emailSubscriptionError,
  subscribe: handleEmailSubscribe,
} = useEmailSubscription()

// Recipe tips state
const tipsLoading = ref(false)
const tipsData = ref({
  tips: [] as Array<{ id: string; amount: number; displayName: string | null; message: string | null; createdAt: Date }>,
  totalTips: 0,
  totalAmount: 0,
})

// Fetch recipe tips
const fetchTips = async () => {
  if (!props.recipe?.id) return
  tipsLoading.value = true
  try {
    const data = await $fetch(`/api/tips?recipeId=${props.recipe.id}`)
    if (data?.data) {
      tipsData.value = data.data
    }
  } catch {
    // Silently fail - tips are optional
    tipsData.value = { tips: [], totalTips: 0, totalAmount: 0 }
  } finally {
    tipsLoading.value = false
  }
}

// Consolidated watcher: single watcher for all recipe-dependent data fetches
// Previously: 2 separate watchers both firing on props.recipe?.id change immediately
watch(() => props.recipe?.id, (newId) => {
  if (!newId) return
  // Fire all data fetches concurrently instead of sequentially
  Promise.all([
    fetchStats(),
    fetchTips(),
    checkSubscription(newId),
  ])
}, { immediate: true })

const handleSubscribe = async () => {
  if (!props.recipe?.id) return
  await subscribe(props.recipe.id)
}

const handleUnsubscribe = async () => {
  if (!props.recipe?.id) return
  await unsubscribe(props.recipe.id)
}
</script>

<template>
  <!-- Sidebar - Desktop Only -->
  <div class="space-y-6">
    <!-- Share Menu Card -->
    <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-stone-100 mb-3 flex items-center gap-2">
        <ShareIcon class="w-5 h-5 text-orange-500" /> {{ t('recipe.share') }}
      </h2>
      <p class="text-gray-600 dark:text-stone-400 text-sm mb-4">
        {{ t('recipe.shareTip') }}
      </p>
      <div class="mb-4">
        <LazyRecipeShareMenu :recipe="recipe" />
      </div>
      <button
        @click="emit('share')"
        class="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold py-3 px-4 rounded-lg hover:from-orange-600 hover:to-amber-500 transition-colors flex items-center justify-center gap-2"
      >
        <ImageIcon class="w-5 h-5" />
        <span>{{ t('recipe.sharePoster') }}</span>
      </button>
    </div>

    <!-- Stats Panel Card -->
    <RecipeStatsPanel
      :views="statsData.views"
      :favorites-count="statsData.favoritesCount"
      :cooking-count="statsData.cookingCount"
    />

    <!-- Email Subscription Card -->
    <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-stone-100 mb-3 flex items-center gap-2">
        <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {{ t('subscription.title') }}
      </h2>
      <p class="text-gray-600 dark:text-stone-400 text-sm mb-4">
        {{ t('subscription.description') }}
      </p>
      <div v-if="isAuthenticated">
        <button
          v-if="!isSubscribed"
          @click="handleSubscribe"
          :disabled="isLoading"
          class="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold py-3 px-4 rounded-lg hover:from-orange-600 hover:to-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg v-if="isLoading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-else>{{ t('subscription.subscribe') }}</span>
        </button>
        <button
          v-else
          @click="handleUnsubscribe"
          :disabled="isLoading"
          class="w-full bg-stone-200 dark:bg-stone-700 text-gray-700 dark:text-stone-200 font-bold py-3 px-4 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg v-if="isLoading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-else>{{ t('subscription.unsubscribe') }}</span>
        </button>
        <p v-if="subscriptionError" class="text-red-500 text-sm mt-2">{{ subscriptionError }}</p>
      </div>
      <!-- Anonymous email subscription form -->
      <div v-else class="space-y-3">
        <input
          v-model="emailInput"
          type="email"
          :placeholder="t('subscription.emailPlaceholder')"
          class="w-full px-4 py-2 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-stone-700 dark:text-stone-100"
          @keyup.enter="handleEmailSubscribe(recipe.id)"
        />
        <button
          @click="handleEmailSubscribe(recipe.id)"
          :disabled="emailSubscriptionLoading || !emailInput"
          class="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold py-3 px-4 rounded-lg hover:from-orange-600 hover:to-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg v-if="emailSubscriptionLoading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-else>{{ t('subscription.subscribeByEmail') }}</span>
        </button>
        <p v-if="emailSubscriptionMessage" class="text-green-600 dark:text-green-400 text-sm">{{ emailSubscriptionMessage }}</p>
        <p v-if="emailSubscriptionError" class="text-red-500 text-sm">{{ emailSubscriptionError }}</p>
      </div>
    </div>

    <!-- Tip/Support Card -->
    <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-stone-100 mb-3 flex items-center gap-2">
        <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ t('tip.title') }}
      </h2>
      <p class="text-gray-600 dark:text-stone-400 text-sm mb-4">
        {{ t('tip.subtitle') }}
      </p>
      <RecipeTipButton :recipe="recipe" />
      
      <!-- Recent Tips -->
      <div v-if="tipsData.tips.length > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-stone-700">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-stone-300 mb-3">{{ t('tip.recentTips') }}</h3>
        <div class="space-y-3">
          <div v-for="tip in tipsData.tips.slice(0, 3)" :key="tip.id" class="flex items-start gap-2 text-sm">
            <div class="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-amber-600 dark:text-amber-400 font-semibold text-xs">${{ tip.amount }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 dark:text-stone-100 truncate">
                {{ tip.displayName || t('tip.anonymous') }}
              </p>
              <p v-if="tip.message" class="text-gray-500 dark:text-stone-400 text-xs truncate">{{ tip.message }}</p>
            </div>
          </div>
        </div>
        <p v-if="tipsData.totalTips > 3" class="text-xs text-gray-500 dark:text-stone-400 mt-2">
          {{ t('tip.totalTips', { count: tipsData.totalTips, amount: tipsData.totalAmount }) }}
        </p>
      </div>
      <p v-else-if="!tipsLoading" class="text-sm text-gray-500 dark:text-stone-400 mt-4">
        {{ t('tip.noTipsYet') }}
      </p>
    </div>

    <!-- Nutrition Info Card -->
    <div v-if="nutrition.hasInfo" class="bg-white dark:bg-stone-800 rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-stone-100 flex items-center gap-2">
          <NutritionIcon class="w-5 h-5 text-green-500" /> {{ t('recipe.nutritionInfo') }}
        </h2>
        <span class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
          {{ nutritionData.label }}
        </span>
      </div>
      <!-- Partial data warning -->
      <div v-if="nutritionData.isCalculated && nutritionData.hasPartialData" class="mb-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
        {{ t('recipe.nutritionPartial', { known: nutritionData.knownCount, total: nutritionData.totalCount }) }}
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div v-if="nutrition.hasCalories" class="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
          <p class="text-orange-500 mb-1 flex justify-center"><FireIcon class="w-6 h-6" /></p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('nutrition.calories') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ nutritionData.calories }}</p>
        </div>
        <div v-if="nutrition.hasProtein" class="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p class="text-blue-500 mb-1 flex justify-center"><ProteinIcon class="w-6 h-6" /></p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('nutrition.protein') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ nutritionData.protein }}g</p>
        </div>
        <div v-if="nutrition.hasCarbs" class="text-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
          <p class="text-yellow-600 mb-1 flex justify-center"><CarbsIcon class="w-6 h-6" /></p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('nutrition.carbs') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ nutritionData.carbs }}g</p>
        </div>
        <div v-if="nutrition.hasFat" class="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
          <p class="text-purple-500 mb-1 flex justify-center"><FatIcon class="w-6 h-6" /></p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('nutrition.fat') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ nutritionData.fat }}g</p>
        </div>
        <div v-if="nutrition.hasFiber" class="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg col-span-2">
          <p class="text-green-600 mb-1 flex justify-center"><FiberIcon class="w-6 h-6" /></p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('nutrition.fiber') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ nutritionData.fiber }}g</p>
        </div>
      </div>
    </div>

    <!-- Quick Info Card -->
    <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-stone-100 mb-4">{{ t('recipe.quickInfo') }}</h2>
      <div class="space-y-3">
        <div v-if="recipe.category" class="flex justify-between">
          <span class="text-gray-600 dark:text-stone-400">{{ t('recipe.category') }}</span>
          <span class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.category }}</span>
        </div>
        <div v-if="recipe.cuisine" class="flex justify-between">
          <span class="text-gray-600 dark:text-stone-400">{{ t('recipe.cuisine') }}</span>
          <span class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.cuisine }}</span>
        </div>
        <div v-if="recipe.source" class="flex justify-between">
          <span class="text-gray-600 dark:text-stone-400">{{ t('recipe.source') }}</span>
          <a
            v-if="recipe.source.startsWith('http')"
            :href="recipe.source"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
          >
            {{ t('recipe.viewSource') }} →
          </a>
          <span v-else class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.source }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
