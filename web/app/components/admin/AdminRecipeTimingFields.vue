<script setup lang="ts">
const props = defineProps<{
  formData: {
    servings: number
    difficulty: 'easy' | 'medium' | 'hard'
    prepTimeMinutes: number
    cookTimeMinutes: number
  }
}>()

const emit = defineEmits<{
  'update:formData': [value: typeof props.formData]
}>()

const { t } = useI18n()

const updateField = (field: string, value: number | string) => {
  emit('update:formData', { ...props.formData, [field]: value })
}
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
    <!-- Servings -->
    <div>
      <label for="recipe-servings" class="block text-sm font-medium text-gray-700 mb-2">
        {{ t('form.servings') }} *
      </label>
      <input
        id="recipe-servings"
        :value="formData.servings"
        @input="updateField('servings', Number(($event.target as HTMLInputElement).value))"
        type="number"
        min="1"
        required
        class="w-full px-3 sm:px-4 py-2 min-h-[44px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-base"
      />
    </div>

    <!-- Difficulty -->
    <div>
      <label for="recipe-difficulty" class="block text-sm font-medium text-gray-700 mb-2">
        {{ t('form.difficulty') }} *
      </label>
      <select
        id="recipe-difficulty"
        :value="formData.difficulty"
        @change="updateField('difficulty', ($event.target as HTMLSelectElement).value)"
        required
        class="w-full px-3 sm:px-4 py-2 min-h-[44px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white text-base"
      >
        <option value="easy">{{ t('difficulty.easy') }}</option>
        <option value="medium">{{ t('difficulty.medium') }}</option>
        <option value="hard">{{ t('difficulty.hard') }}</option>
      </select>
    </div>

    <!-- Prep Time -->
    <div>
      <label for="recipe-prep-time" class="block text-sm font-medium text-gray-700 mb-2">
        {{ t('form.prepTime') }} *
      </label>
      <input
        id="recipe-prep-time"
        :value="formData.prepTimeMinutes"
        @input="updateField('prepTimeMinutes', Number(($event.target as HTMLInputElement).value))"
        type="number"
        min="0"
        required
        class="w-full px-3 sm:px-4 py-2 min-h-[44px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-base"
      />
    </div>

    <!-- Cook Time -->
    <div>
      <label for="recipe-cook-time" class="block text-sm font-medium text-gray-700 mb-2">
        {{ t('form.cookTime') }} *
      </label>
      <input
        id="recipe-cook-time"
        :value="formData.cookTimeMinutes"
        @input="updateField('cookTimeMinutes', Number(($event.target as HTMLInputElement).value))"
        type="number"
        min="0"
        required
        class="w-full px-3 sm:px-4 py-2 min-h-[44px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-base"
      />
    </div>
  </div>
</template>
