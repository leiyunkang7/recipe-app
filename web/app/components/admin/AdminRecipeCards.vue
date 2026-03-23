<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipes: Recipe[]
  selectedRecipes: string[]
}>()

const emit = defineEmits<{
  toggleSelect: [id: string]
  delete: [id: string]
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const locale = useI18n().locale

const difficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 text-green-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'hard': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const difficultyLabel = (difficulty: string) => t(`difficulty.${difficulty}`)
</script>

<template>
  <!-- Mobile Card List -->
  <div class="md:hidden divide-y divide-gray-200">
    <div
      v-for="recipe in recipes"
      :key="recipe.id"
      class="p-4 hover:bg-gray-50 transition-colors"
    >
      <div class="flex items-start gap-3">
        <input 
          type="checkbox" 
          :checked="selectedRecipes.includes(recipe.id.toString())"
          @change="emit('toggleSelect', recipe.id.toString())"
          class="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-orange-500 flex-shrink-0"
        >
        <div class="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg overflow-hidden flex-shrink-0">
          <NuxtImg
            v-if="recipe.imageUrl"
            :src="recipe.imageUrl"
            :alt="recipe.title"
            class="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            format="webp"
            sizes="64px"
            quality="75"
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
                difficultyColor(recipe.difficulty)
              ]"
            >
              {{ difficultyLabel(recipe.difficulty) }}
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
