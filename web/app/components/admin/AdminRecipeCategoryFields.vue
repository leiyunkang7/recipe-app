<script setup lang="ts">
const props = defineProps<{
  formData: {
    category: string
    cuisine: string
  }
  categoryKeys: Array<{ id: number; name: string; displayName: string }>
  cuisineKeys: Array<{ id: number; name: string; displayName: string }>
}>()

const emit = defineEmits<{
  'update:formData': [value: typeof props.formData]
}>()

const { t } = useI18n()

const updateField = (field: string, value: string) => {
  emit('update:formData', { ...props.formData, [field]: value })
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <!-- Category -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        {{ t('form.category') }} *
      </label>
      <select
        :value="formData.category"
        @change="updateField('category', ($event.target as HTMLSelectElement).value)"
        required
        class="w-full px-4 py-2 min-h-[44px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white text-base"
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
        class="w-full px-4 py-2 min-h-[44px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white text-base"
      >
        <option value="">{{ t('form.selectCuisine') }}</option>
        <option v-for="cui in cuisineKeys" :key="cui.name" :value="cui.name">
          {{ cui.displayName }}
        </option>
      </select>
    </div>
  </div>
</template>
