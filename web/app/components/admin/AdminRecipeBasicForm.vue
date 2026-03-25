<script setup lang="ts">
import type { Locale, Translation, IngredientTranslation, StepTranslation, NutritionInfo } from '~/types'

const props = defineProps<{
  formData: {
    category: string
    cuisine: string
    servings: number
    prepTimeMinutes: number
    cookTimeMinutes: number
    difficulty: 'easy' | 'medium' | 'hard'
    imageUrl: string
    source: string
    tags: string[]
    nutritionInfo: NutritionInfo
    translations: Translation[]
    ingredients: Array<{
      name: string
      amount: number
      unit: string
      translations: IngredientTranslation[]
    }>
    steps: Array<{
      stepNumber: number
      instruction: string
      durationMinutes?: number
      translations: StepTranslation[]
    }>
  }
  categoryKeys: Array<{ id: number; name: string; displayName: string }>
  cuisineKeys: Array<{ id: number; name: string; displayName: string }>
  activeLocale: Locale
  currentTranslation: Translation
}>()

const emit = defineEmits<{
  'update:activeLocale': [locale: Locale]
  'update:formData': [value: typeof props.formData]
}>()

const { t } = useI18n()

const updateField = <K extends keyof typeof props.formData>(field: K, value: typeof props.formData[K]) => {
  emit('update:formData', { ...props.formData, [field]: value })
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-6">
    <!-- Language Switcher -->
    <AdminRecipeLanguageSwitcher 
      :active-locale="activeLocale" 
      @update:active-locale="emit('update:activeLocale', $event)" 
    />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Title & Description -->
      <AdminRecipeBasicFields :current-translation="currentTranslation" />

      <!-- Category & Cuisine -->
      <AdminRecipeCategoryFields 
        :form-data="{ category: formData.category, cuisine: formData.cuisine }"
        :category-keys="categoryKeys"
        :cuisine-keys="cuisineKeys"
        @update:form-data="(val) => { updateField('category', val.category); updateField('cuisine', val.cuisine) }"
      />

      <!-- Servings, Difficulty, Prep Time, Cook Time -->
      <AdminRecipeTimingFields 
        :form-data="{ 
          servings: formData.servings, 
          difficulty: formData.difficulty,
          prepTimeMinutes: formData.prepTimeMinutes,
          cookTimeMinutes: formData.cookTimeMinutes
        }"
        @update:form-data="(val) => { 
          updateField('servings', val.servings); 
          updateField('difficulty', val.difficulty);
          updateField('prepTimeMinutes', val.prepTimeMinutes);
          updateField('cookTimeMinutes', val.cookTimeMinutes);
        }"
      />

      <!-- Image -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('form.recipeImage') }}
        </label>
        <div class="bg-gray-50 rounded-lg p-4">
          <ImageUpload 
            :model-value="formData.imageUrl" 
            @update:model-value="updateField('imageUrl', $event)" 
            alt="Recipe preview" 
          />
          <p v-if="formData.imageUrl" class="mt-2 text-sm text-green-600 flex items-center gap-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            {{ t('imageUpload.imageUploaded') }}
          </p>
        </div>
      </div>

      <!-- Source -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('form.source') }}
        </label>
        <input
          :value="formData.source"
          @input="updateField('source', ($event.target as HTMLInputElement).value)"
          type="url"
          class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          :placeholder="t('form.sourcePlaceholder')"
        />
      </div>
    </div>
  </div>
</template>
