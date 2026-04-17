<script setup lang="ts">
/**
 * NutritionLabel - FDA Style Nutrition Label Component
 *
 * Features:
 * - Display per-serving nutrition facts
 * - Main nutrients highlight
 * - Clean card style
 */

interface Props {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  servings?: number
}

const props = withDefaults(defineProps<Props>(), {
  servings: 1,
})

const { t } = useI18n()

// Nutrient data
const nutrients = computed(() => [
  { key: 'protein', label: t('nutrition.protein'), value: props.protein, unit: 'g', highlight: false },
  { key: 'carbs', label: t('nutrition.carbs'), value: props.carbs, unit: 'g', highlight: false },
  { key: 'fat', label: t('nutrition.fat'), value: props.fat, unit: 'g', highlight: false },
  { key: 'fiber', label: t('nutrition.dietaryFiber'), value: props.fiber, unit: 'g', highlight: false },
])

const hasNutrients = computed(() =>
  props.protein || props.carbs || props.fat || props.fiber
)
</script>

<template>
  <div class="nutrition-label bg-white dark:bg-stone-800 rounded-xl shadow-md p-4">
    <!-- Header -->
    <div class="border-b-2 border-gray-900 dark:border-stone-100 pb-1 mb-3">
      <h3 class="text-lg font-bold text-gray-900 dark:text-stone-100">
        {{ t('nutrition.nutritionInfo') }}
      </h3>
      <p class="text-xs text-gray-500 dark:text-stone-400 mt-0.5">
        {{ t('nutrition.perServing') }}
      </p>
    </div>

    <!-- Calories -->
    <div v-if="calories" class="border-b border-gray-300 dark:border-stone-600 pb-2 mb-2">
      <div class="flex justify-between items-baseline">
        <span class="text-gray-900 dark:text-stone-100 font-semibold">{{ t('nutrition.calories') }}</span>
        <span class="text-2xl font-bold text-gray-900 dark:text-stone-100">{{ calories }}</span>
      </div>
      <p class="text-xs text-gray-500 dark:text-stone-400">kcal</p>
    </div>

    <!-- Per serving description -->
    <p class="text-xs text-gray-500 dark:text-stone-400 mb-3">
      {{ t('nutrition.perServingDesc', { servings: props.servings }) }}
    </p>

    <!-- Nutrient list -->
    <div v-if="hasNutrients" class="space-y-1.5">
      <div
        v-for="nutrient in nutrients"
        :key="nutrient.key"
        v-show="nutrient.value"
        class="flex justify-between text-sm"
      >
        <span class="text-gray-700 dark:text-stone-300">{{ nutrient.label }}</span>
        <span class="font-semibold text-gray-900 dark:text-stone-100">
          {{ nutrient.value }}{{ nutrient.unit }}
        </span>
      </div>
    </div>

    <!-- No data message -->
    <p v-else-if="!calories" class="text-sm text-gray-500 dark:text-stone-400 text-center py-2">
      {{ t('nutrition.noData') }}
    </p>
  </div>
</template>
