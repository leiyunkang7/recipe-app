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
</template>
