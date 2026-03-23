<script setup lang="ts">
defineProps<{
  tags: string[]
  isMobile?: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <!-- Mobile Tags -->
  <div v-if="isMobile" class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm p-4">
    <h2 class="text-lg font-bold text-gray-900 dark:text-stone-100 mb-3 flex items-center gap-2">
      🏷️ {{ t('recipe.tags') }}
    </h2>
    <div class="flex flex-wrap gap-2">
      <span
        v-for="tag in tags"
        :key="tag"
        class="px-3 py-1.5 bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium"
      >
        {{ tag }}
      </span>
    </div>
  </div>

  <!-- Desktop Tags -->
  <div v-else class="bg-white dark:bg-stone-800 rounded-xl shadow-md dark:shadow-stone-900/30 p-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
      🏷️ {{ t('recipe.tags') }}
    </h2>
    <div class="flex flex-wrap gap-2">
      <span
        v-for="tag in tags"
        :key="tag"
        class="px-3 py-2 bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium"
      >
        {{ tag }}
      </span>
    </div>
  </div>
</template>
