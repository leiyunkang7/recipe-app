<script setup lang="ts">
import type { NutritionInfo } from '~/types'

const props = defineProps<{
  nutritionInfo: NutritionInfo
}>()

const emit = defineEmits<{
  'update:nutritionInfo': [value: NutritionInfo]
}>()

const { t } = useI18n()

const updateField = (field: keyof NutritionInfo, value: number | undefined) => {
  emit('update:nutritionInfo', { ...props.nutritionInfo, [field]: value })
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-4">{{ t('form.nutritionOptional') }}</h2>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('recipe.calories') }}</label>
        <input
          :value="nutritionInfo.calories"
          @input="updateField('calories', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
          type="number"
          min="0"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('recipe.protein') }} (g)</label>
        <input
          :value="nutritionInfo.protein"
          @input="updateField('protein', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
          type="number"
          min="0"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('recipe.carbs') }} (g)</label>
        <input
          :value="nutritionInfo.carbs"
          @input="updateField('carbs', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
          type="number"
          min="0"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('recipe.fat') }} (g)</label>
        <input
          :value="nutritionInfo.fat"
          @input="updateField('fat', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
          type="number"
          min="0"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('recipe.fiber') }} (g)</label>
        <input
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
