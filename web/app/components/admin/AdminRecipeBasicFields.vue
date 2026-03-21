<script setup lang="ts">
import type { Translation } from '~/types'

const props = defineProps<{
  currentTranslation: Translation
}>()

const { t } = useI18n()
</script>

<template>
  <div class="md:col-span-2">
    <!-- Title -->
    <div class="mb-4">
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
    <div>
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
  </div>
</template>
