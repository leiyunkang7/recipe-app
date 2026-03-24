<script setup lang="ts">
import type { Recipe } from '~/types'
import { DIFFICULTY_CONFIG, getDifficultyLabel } from '~/utils/difficulty'

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

// Use Set for O(1) lookup instead of O(n) array.includes - consistent with AdminRecipeTable/AdminRecipeMobileList
const selectedSet = computed(() => new Set(props.selectedRecipes))

const isSelected = (id: string) => selectedSet.value.has(id)

const getDifficultyBgTextClass = (difficulty: string) => {
  const config = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG]
  return config ? `${config.bgClass} ${config.textClass}` : 'bg-gray-100 text-gray-800'
}
</script>

<template>
  <!-- Mobile Card List -->
  <div class="md:hidden divide-y divide-gray-200">
    <div
      v-for="recipe in recipes"
      :key="recipe.id"
      v-memo="[recipe.id, recipe.title, recipe.imageUrl, recipe.category, recipe.difficulty, recipe.prepTimeMinutes, recipe.cookTimeMinutes, selectedRecipes.includes(recipe.id.toString())]"
      class="p-4 hover:bg-gray-50 transition-colors"
    >
      <div class="flex items-start gap-3">
        <input
          type="checkbox"
          :checked="isSelected(recipe.id.toString())"
          @change="emit('toggleSelect', recipe.id.toString())"
          class="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-orange-500 flex-shrink-0"
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
            class="block font-semibold text-gray-900 hover:text-orange-600 transition-colors truncate"
          >
            {{ recipe.title }}
          </NuxtLink>
          <div class="flex flex-wrap items-center gap-2 mt-1">
            <span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              {{ recipe.category }}
            </span>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-xs font-semibold uppercase',
                getDifficultyBgTextClass(recipe.difficulty)
              ]"
            >
              {{ getDifficultyLabel(recipe.difficulty) }}
            </span>
            <span class="text-xs text-gray-500">
              {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }}{{ t('recipe.min') }}
            </span>
          </div>
        </div>
        <div class="flex flex-col gap-1 flex-shrink-0">
          <NuxtLink
            :to="localePath(`/admin/recipes/${recipe.id}/edit`, locale)"
            class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            :title="t('common.edit')"
          >
            ✏️
          </NuxtLink>
          <button
            @click="emit('delete', recipe.id)"
            class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
