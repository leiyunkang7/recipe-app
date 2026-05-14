<script setup lang="ts">
interface Props {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  servings?: number
}

const props = withDefaults(defineProps<Props>(), {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  servings: 1,
})

const { t } = useI18n()

// Daily recommended values (FDA based)
const dailyValues: Record<string, number> = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 78,
  fiber: 28,
}

const nutrients = [
  { key: 'calories', label: t('nutrition.calories'), unit: '', dv: dailyValues.calories, color: 'text-orange-600 dark:text-orange-400' },
  { key: 'protein', label: t('nutrition.protein'), unit: 'g', dv: dailyValues.protein, color: 'text-red-600 dark:text-red-400' },
  { key: 'carbs', label: t('nutrition.carbs'), unit: 'g', dv: dailyValues.carbs, color: 'text-blue-600 dark:text-blue-400' },
  { key: 'fat', label: t('nutrition.fat'), unit: 'g', dv: dailyValues.fat, color: 'text-yellow-600 dark:text-yellow-400' },
  { key: 'fiber', label: t('nutrition.fiber'), unit: 'g', dv: dailyValues.fiber, color: 'text-green-600 dark:text-green-400' },
]

const getPercentDV = (value: number, dv: number) => {
  return dv > 0 ? Math.round((value / dv) * 100) : 0
}
</script>

<template>
  <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md dark:shadow-stone-900/30 p-4 border border-gray-200 dark:border-stone-700">
    <!-- Header -->
    <div class="border-b-2 border-black dark:border-white pb-2 mb-3">
      <h3 class="text-lg font-bold text-gray-900 dark:text-stone-100">
        {{ t('recipe.nutritionInfo') }}
      </h3>
      <p class="text-xs text-gray-500 dark:text-stone-400">
        {{ t('recipe.perServing', { count: servings }) }}
      </p>
    </div>

    <!-- Calories (prominent) -->
    <div class="flex items-baseline justify-between border-b border-gray-300 dark:border-stone-600 pb-2 mb-2">
      <div>
        <span class="text-2xl font-bold text-gray-900 dark:text-stone-100">{{ calories }}</span>
        <span class="text-sm text-gray-600 dark:text-stone-400 ml-1">{{ t('nutrition.calories') }}</span>
      </div>
      <div class="text-right">
        <span class="text-xs font-semibold text-orange-600 dark:text-orange-400">
          {{ getPercentDV(calories, dailyValues.calories) }}% {{ t('nutrition.dailyValue') }}
        </span>
      </div>
    </div>

    <!-- Nutrients Grid -->
    <div class="space-y-2">
      <div
        v-for="nutrient in nutrients.slice(1)"
        :key="nutrient.key"
        class="flex items-center justify-between text-sm"
      >
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700 dark:text-stone-200">
            {{ nutrient.label }}
          </span>
          <span class="text-gray-500 dark:text-stone-400">
            {{ nutrient.unit }}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-24 h-1.5 bg-gray-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="nutrient.color.replace('text-', 'bg-')"
              :style="{ width: `${Math.min(getPercentDV(props[nutrient.key as keyof Props] as number || 0, nutrient.dv), 100)}%` }"
            />
          </div>
          <span class="font-medium text-gray-800 dark:text-stone-100 w-16 text-right">
            {{ props[nutrient.key as keyof Props] || 0 }}{{ nutrient.unit }}
          </span>
          <span class="text-xs text-gray-400 dark:text-stone-500 w-10 text-right">
            {{ getPercentDV(props[nutrient.key as keyof Props] as number || 0, nutrient.dv) }}%
          </span>
        </div>
      </div>
    </div>

    <!-- Footer note -->
    <p class="text-xs text-gray-400 dark:text-stone-500 mt-3 pt-2 border-t border-gray-200 dark:border-stone-700">
      {{ t('nutrition.dailyValueFootnote') }}
    </p>
  </div>
</template>
