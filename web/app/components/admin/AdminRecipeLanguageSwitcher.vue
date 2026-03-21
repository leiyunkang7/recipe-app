<script setup lang="ts">
import type { Locale } from '~/types'

const props = defineProps<{
  activeLocale: Locale
}>()

const emit = defineEmits<{
  'update:activeLocale': [locale: Locale]
}>()

const { t } = useI18n()
</script>

<template>
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
</template>
