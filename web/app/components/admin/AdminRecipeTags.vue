<script setup lang="ts">
const props = defineProps<{
  tags: string[]
  tagInput: string
}>()

const emit = defineEmits<{
  'update:tags': [value: string[]]
  'update:tagInput': [value: string]
  addTag: []
  removeTag: [tag: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-4 sm:p-6">
    <h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-4">{{ t('form.tags') }}</h2>
    <div class="flex flex-col sm:flex-row gap-2 mb-4">
      <input
        :value="tagInput"
        @input="emit('update:tagInput', ($event.target as HTMLInputElement).value)"
        @keyup.enter="emit('addTag')"
        type="text"
        :placeholder="t('form.tagsPlaceholder')"
        class="flex-1 px-4 py-2 min-h-[44px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-base"
      />
      <button
        type="button"
        @click="emit('addTag')"
        class="px-4 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
      >
        {{ t('form.addTag') }}
      </button>
    </div>
    <div class="flex flex-wrap gap-2">
      <span
        v-for="tag in tags"
        :key="tag"
        class="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1"
      >
        {{ tag }}
        <button
          type="button"
          @click="emit('removeTag', tag)"
          class="min-w-[32px] min-h-[32px] flex items-center justify-center text-green-600 hover:text-green-800 rounded hover:bg-green-100 transition-colors"
          :aria-label="`Remove ${tag}`"
        >
          ×
        </button>
      </span>
    </div>
  </div>
</template>
