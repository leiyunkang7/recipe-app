<script setup lang="ts">
/**
 * ProfileRecipeGrid - 用户食谱列表（标记已吃）
 */
const { t } = useI18n()

interface Recipe {
  id: string
  title: string
  nutritionInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
  }
}

const props = defineProps<{
  selectedDate: string
  dailyRecipes: Recipe[]
  isEaten: (id: string) => boolean
}>()

const emit = defineEmits<{
  toggleEaten: [id: string]
}>()

const getToday = () => new Date().toISOString().split('T')[0]

const dateDisplay = computed(() => {
  const today = getToday()
  if (props.selectedDate === today) return '今天'
  const d = new Date(props.selectedDate)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})
</script>

<template>
  <!-- 收藏食谱列表（标记已吃） -->
  <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
    <h2 class="text-base font-semibold text-gray-700 dark:text-stone-200 mb-3">
      {{ dateDisplay }} {{ t('profile.myRecipes') }}
    </h2>

    <div v-if="dailyRecipes.length === 0" class="text-center py-8 flex flex-col items-center gap-3">
      <div class="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
        <span class="text-3xl">🍽️</span>
      </div>
      <div>
        <p class="text-gray-500 dark:text-stone-400 text-sm font-medium">
          {{ t('profile.noFavoriteRecipes') }}
        </p>
        <p class="text-gray-400 dark:text-stone-500 text-xs mt-1">
          {{ t('profile.addRecipesHint') }}
        </p>
      </div>
    </div>

    <div v-else class="space-y-2 max-h-96 overflow-y-auto">
      <div
        v-for="recipe in dailyRecipes"
        :key="recipe.id"
        :class="[
          'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer',
          isEaten(recipe.id)
            ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
            : 'bg-gray-50 dark:bg-stone-700 hover:bg-gray-100 dark:hover:bg-stone-600'
        ]"
        @click="emit('toggleEaten', recipe.id)"
      >
        <!-- 已吃标记 -->
        <div
          :class="[
            'w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200',
            isEaten(recipe.id)
              ? 'bg-orange-500 text-white'
              : 'border-2 border-gray-300 dark:border-stone-500'
          ]"
        >
          <span v-if="isEaten(recipe.id)" class="text-xs">✓</span>
        </div>

        <!-- 食谱信息 -->
        <div class="flex-1 min-w-0">
          <p
            :class="[
              'text-sm font-medium truncate',
              isEaten(recipe.id)
                ? 'text-orange-700 dark:text-orange-300'
                : 'text-gray-700 dark:text-stone-200'
            ]"
          >
            {{ recipe.title }}
          </p>
          <p v-if="recipe.nutritionInfo" class="text-xs text-gray-400 dark:text-stone-500">
            {{ Math.round(recipe.nutritionInfo.calories || 0) }} kcal
          </p>
        </div>

        <!-- 营养标签 -->
        <div v-if="recipe.nutritionInfo" class="flex-shrink-0 flex gap-1">
          <span
            v-if="recipe.nutritionInfo.protein"
            class="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-500 text-xs rounded"
          >
            P
          </span>
          <span
            v-if="recipe.nutritionInfo.carbs"
            class="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 text-xs rounded"
          >
            C
          </span>
          <span
            v-if="recipe.nutritionInfo.fat"
            class="px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 text-xs rounded"
          >
            F
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
