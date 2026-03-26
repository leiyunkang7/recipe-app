<script setup lang="ts">
import type { Recipe } from '~/types'
import { getDifficultyClasses, getDifficultyLabel } from '~/utils/difficulty'

const props = defineProps<{
  recipes: Recipe[]
  selectedRecipes: string[]
}>()

const emit = defineEmits<{
  toggleSelect: [id: string]
  delete: [id: string]
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

// Use Set for O(1) lookup instead of O(n) array.includes
// Pre-computed selected state for v-memo tracking - direct .has() call avoids function call overhead
const selectedSet = computed(() => new Set(props.selectedRecipes))
</script>

<template>
  <div class="divide-y divide-gray-200 dark:divide-stone-700">
    <div
      v-for="recipe in recipes"
      :key="recipe.id"
      v-memo="[recipe.id, recipe.title, recipe.imageUrl, recipe.category, recipe.difficulty, recipe.prepTimeMinutes, recipe.cookTimeMinutes, recipe.description, selectedSet.has(recipe.id)]"
      class="p-4 hover:bg-gray-50 dark:hover:bg-stone-800/50 transition-colors"
    >
      <div class="flex items-start gap-3">
        <input
          type="checkbox"
          :checked="selectedSet.has(recipe.id)"
          @change="emit('toggleSelect', recipe.id)"
          class="mt-1 w-5 h-5 min-w-[20px] min-h-[20px] text-orange-600 rounded focus:ring-orange-500 flex-shrink-0 cursor-pointer"
        >
        <div class="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg overflow-hidden flex-shrink-0">
          <AppImage
            v-if="recipe.imageUrl"
            :src="recipe.imageUrl"
            :alt="recipe.title"
            class="w-full h-full"
            sizes="64px"
            quality="75"
            :object-fit="'cover'"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="text-2xl">🍽️</span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <NuxtLink
            :to="localePath(`/admin/recipes/${recipe.id}/edit`, locale)"
            class="block font-semibold text-gray-900 dark:text-stone-100 hover:text-orange-600 dark:hover:text-orange-400 transition-colors truncate"
          >
            {{ recipe.title }}
          </NuxtLink>
          <div class="flex flex-wrap items-center gap-2 mt-1">
            <span class="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
              {{ recipe.category }}
            </span>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-xs font-semibold uppercase',
                getDifficultyClasses(recipe.difficulty)
              ]"
            >
              {{ getDifficultyLabel(recipe.difficulty, locale) }}
            </span>
            <span class="text-xs text-gray-500 dark:text-stone-400">
              {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }}{{ t('recipe.min') }}
            </span>
          </div>
        </div>
        <div class="flex flex-col gap-1 flex-shrink-0">
          <NuxtLink
            :to="localePath(`/admin/recipes/${recipe.id}/edit`, locale)"
            class="min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            :title="t('common.edit')"
          >
            ✏️
          </NuxtLink>
          <button
            @click="emit('delete', recipe.id)"
            class="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            :title="t('common.delete')"
            :aria-label="t('common.delete')"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
