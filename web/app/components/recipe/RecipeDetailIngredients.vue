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

// Pre-compute selected state for all ingredients using Set for O(1) lookups
const selectedSet = computed(() => new Set(props.selectedIngredients))
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
        v-for="ing in props.recipe.ingredients"
        :key="ing.name"
        v-memo="[selectedSet.has(ing.name)]"
        class="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer"
        :class="selectedSet.has(ing.name) ? 'bg-green-50 dark:bg-green-900/20 line-through opacity-60' : 'bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600'"
        @click="emit('toggleIngredient', ing.name)"
      >
        <div
          class="w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center transition-all"
          :class="selectedSet.has(ing.name) ? 'bg-green-500 text-white' : 'border-2 border-gray-300 dark:border-stone-500'"
        >
          <svg v-if="selectedSet.has(ing.name)" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <span class="flex-1 text-sm font-medium" :class="selectedSet.has(ing.name) ? 'text-gray-400' : 'text-gray-900 dark:text-stone-100'">
          {{ ing.name }}
        </span>
        <span class="text-xs" :class="selectedSet.has(ing.name) ? 'text-gray-400' : 'text-gray-600 dark:text-stone-400'">
          {{ ing.amount }} {{ ing.unit }}
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
        v-for="ing in props.recipe.ingredients"
        :key="ing.name"
        v-memo="[selectedSet.has(ing.name)]"
        class="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer"
        :class="selectedSet.has(ing.name) ? 'bg-green-50 dark:bg-green-900/20 line-through opacity-60' : 'bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600'"
        @click="emit('toggleIngredient', ing.name)"
      >
        <div
          class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
          :class="selectedSet.has(ing.name) ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-stone-500'"
        >
          <svg v-if="selectedSet.has(ing.name)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <span class="flex-1 font-medium" :class="selectedSet.has(ing.name) ? 'text-gray-400' : 'text-gray-900 dark:text-stone-100'">{{ ing.name }}</span>
        <span class="text-sm" :class="selectedSet.has(ing.name) ? 'text-gray-400' : 'text-gray-600 dark:text-stone-400'">
          {{ ing.amount }} {{ ing.unit }}
        </span>
      </li>
    </ul>
  </div>
</template>
