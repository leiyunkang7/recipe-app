<script setup lang="ts">
import type { NutritionInfo } from '~/types'

const props = defineProps<{
  nutritionInfo: NutritionInfo
  onCalculate?: () => Promise<NutritionInfo | null>
}>()

const emit = defineEmits<{
  'update:nutritionInfo': [value: NutritionInfo]
}>()

const { t } = useI18n()
const isCalculating = ref(false)

const updateField = (field: keyof NutritionInfo, value: number | undefined) => {
  emit('update:nutritionInfo', { ...props.nutritionInfo, [field]: value })
}

const handleCalculate = async () => {
  if (!props.onCalculate || isCalculating.value) return
  
  isCalculating.value = true
  try {
    const result = await props.onCalculate()
    if (result) {
      emit('update:nutritionInfo', result)
    }
  } finally {
    isCalculating.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900">{{ t('form.nutritionOptional') }}</h2>
      <button
        v-if="onCalculate"
        type="button"
        :disabled="isCalculating"
        @click="handleCalculate"
        class="px-4 py-2 bg-orange-100 text-orange-700 font-medium rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <svg v-if="isCalculating" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span v-else>{{ t('form.calculateNutrition') || '从食材计算' }}</span>
      </button>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div>
        <label for="nutrition-calories" class="block text-sm font-medium text-gray-700 mb-2">{{ t('nutrition.calories') }}</label>
        <input
          id="nutrition-calories"
          :value="nutritionInfo.calories"
          @input="updateField('calories', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
          type="number"
          min="0"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>
      <div>
        <label for="nutrition-protein" class="block text-sm font-medium text-gray-700 mb-2">{{ t('nutrition.protein') }} (g)</label>
        <input
          id="nutrition-protein"
          :value="nutritionInfo.protein"
          @input="updateField('protein', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
          type="number"
          min="0"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>
      <div>
        <label for="nutrition-carbs" class="block text-sm font-medium text-gray-700 mb-2">{{ t('nutrition.carbs') }} (g)</label>
        <input
          id="nutrition-carbs"
          :value="nutritionInfo.carbs"
          @input="updateField('carbs', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
          type="number"
          min="0"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>
      <div>
        <label for="nutrition-fat" class="block text-sm font-medium text-gray-700 mb-2">{{ t('nutrition.fat') }} (g)</label>
        <input
          id="nutrition-fat"
          :value="nutritionInfo.fat"
          @input="updateField('fat', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
          type="number"
          min="0"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>
      <div>
        <label for="nutrition-fiber" class="block text-sm font-medium text-gray-700 mb-2">{{ t('nutrition.fiber') }} (g)</label>
        <input
          id="nutrition-fiber"
          :value="nutritionInfo.fiber"
          @input="updateField('fiber', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
          type="number"
          min="0"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>
    </div>
  </div>
</template>