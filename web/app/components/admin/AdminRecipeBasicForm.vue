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

const updateField = (field: string, value: any) => {
  emit('update:formData', { ...props.formData, [field]: value })
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-6">
    <!-- Language Switcher -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900">{{ t('form.language') }}</h2>
      <div class="flex gap-2">
        <button
          type="button"
          @click="emit('update:activeLocale', 'en')"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            activeLocale === 'en' 
              ? 'bg-orange-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ t('form.english') }}
        </button>
        <button
          type="button"
          @click="emit('update:activeLocale', 'zh-CN')"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            activeLocale === 'zh-CN' 
              ? 'bg-orange-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ t('form.chinese') }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Title -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('form.title') }} *
        </label>
        <input
          v-model="currentTranslation.title"
          type="text"
          required
          class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          :placeholder="t('form.titlePlaceholder')"
        />
      </div>

      <!-- Description -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('form.description') }}
        </label>
        <textarea
          v-model="currentTranslation.description"
          rows="3"
          class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          :placeholder="t('form.descriptionPlaceholder')"
        />
      </div>

      <!-- Category -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('form.category') }} *
        </label>
        <select
          :value="formData.category"
          @change="updateField('category', ($event.target as HTMLSelectElement).value)"
          required
          class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
        >
          <option value="">{{ t('form.selectCategory') }}</option>
          <option v-for="cat in categoryKeys" :key="cat.name" :value="cat.name">
            {{ cat.displayName }}
          </option>
        </select>
      </div>

      <!-- Cuisine -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('form.cuisine') }}
        </label>
        <select
          :value="formData.cuisine"
          @change="updateField('cuisine', ($event.target as HTMLSelectElement).value)"
          class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
        >
          <option value="">{{ t('form.selectCuisine') }}</option>
          <option v-for="cui in cuisineKeys" :key="cui.name" :value="cui.name">
            {{ cui.displayName }}
          </option>
        </select>
      </div>

      <!-- Servings -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('form.servings') }} *
        </label>
        <input
          :value="formData.servings"
          @input="updateField('servings', Number(($event.target as HTMLInputElement).value))"
          type="number"
          min="1"
          required
          class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>

      <!-- Difficulty -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('form.difficulty') }} *
        </label>
        <select
          :value="formData.difficulty"
          @change="updateField('difficulty', ($event.target as HTMLSelectElement).value)"
          required
          class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
        >
          <option value="easy">{{ t('difficulty.easy') }}</option>
          <option value="medium">{{ t('difficulty.medium') }}</option>
          <option value="hard">{{ t('difficulty.hard') }}</option>
        </select>
      </div>

      <!-- Prep Time -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('form.prepTime') }} *
        </label>
        <input
          :value="formData.prepTimeMinutes"
          @input="updateField('prepTimeMinutes', Number(($event.target as HTMLInputElement).value))"
          type="number"
          min="0"
          required
          class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>

      <!-- Cook Time -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('form.cookTime') }} *
        </label>
        <input
          :value="formData.cookTimeMinutes"
          @input="updateField('cookTimeMinutes', Number(($event.target as HTMLInputElement).value))"
          type="number"
          min="0"
          required
          class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>

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
