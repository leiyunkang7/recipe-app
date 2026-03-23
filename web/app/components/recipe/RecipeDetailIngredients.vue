<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipe: Recipe
  selectedIngredients: string[]
  isMobile?: boolean
}>()

const emit = defineEmits<{
  toggleIngredient: [name: string]
}>()

const { t } = useI18n()

const totalIngredients = computed(() => props.recipe?.ingredients.length || 0)
const selectedCount = computed(() => props.selectedIngredients.length)

// Use Set for O(1) lookups instead of repeated includes() calls
const selectedSet = computed(() => new Set(props.selectedIngredients))

// Helper to check if ingredient is selected - O(1) instead of O(n)
const isSelected = (name: string) => selectedSet.value.has(name)
</script>

<template>
  <!-- Mobile Ingredients -->
  <div v-if="isMobile" class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm p-4">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-bold text-gray-900 dark:text-stone-100 flex items-center gap-2">
        🛒 {{ t('recipe.ingredients') }}
      </h2>
      <span v-if="totalIngredients > 0" class="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
        {{ selectedCount }}/{{ totalIngredients }}
      </span>
    </div>
    <ul class="space-y-2">
      <li
        v-for="ingredient in recipe.ingredients"
        :key="ingredient.name"
        class="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer"
        :class="isSelected(ingredient.name) ? 'bg-green-50 dark:bg-green-900/20 line-through opacity-60' : 'bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600'"
        @click="emit('toggleIngredient', ingredient.name)"
      >
        <div
          class="w-6 h-6 min-w-[24px] min-h-[24px] rounded-md flex items-center justify-center transition-all"
          :class="isSelected(ingredient.name) ? 'bg-green-500 text-white' : 'border-2 border-gray-300 dark:border-stone-500'"
        >
          <svg v-if="isSelected(ingredient.name)" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <span class="flex-1 text-sm font-medium" :class="isSelected(ingredient.name) ? 'text-gray-400' : 'text-gray-900 dark:text-stone-100'">
          {{ ingredient.name }}
        </span>
        <span class="text-xs" :class="isSelected(ingredient.name) ? 'text-gray-400' : 'text-gray-600 dark:text-stone-400'">
          {{ ingredient.amount }} {{ ingredient.unit }}
        </span>
      </li>
    </ul>
  </div>

  <!-- Desktop Ingredients -->
  <div v-else class="bg-white dark:bg-stone-800 rounded-xl shadow-md dark:shadow-stone-900/30 p-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
      🛒 {{ t('recipe.ingredients') }}
    </h2>
    <ul class="space-y-3">
      <li
        v-for="ingredient in recipe.ingredients"
        :key="ingredient.name"
        class="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer"
        :class="isSelected(ingredient.name) ? 'bg-green-50 dark:bg-green-900/20 line-through opacity-60' : 'bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600'"
        @click="emit('toggleIngredient', ingredient.name)"
      >
        <input 
          type="checkbox" 
          :checked="isSelected(ingredient.name)"
          class="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
        >
        <span class="flex-1 font-medium" :class="isSelected(ingredient.name) ? 'text-gray-400' : 'text-gray-900 dark:text-stone-100'">{{ ingredient.name }}</span>
        <span class="text-sm" :class="isSelected(ingredient.name) ? 'text-gray-400' : 'text-gray-600 dark:text-stone-400'">
          {{ ingredient.amount }} {{ ingredient.unit }}
        </span>
      </li>
    </ul>
  </div>
</template>
