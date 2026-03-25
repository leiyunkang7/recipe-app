<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipe: Recipe
  selectedIngredients: Set<string>
  isMobile?: boolean
}>()

const emit = defineEmits<{
  toggleIngredient: [name: string]
}>()

const { t } = useI18n()

const totalIngredients = computed(() => props.recipe?.ingredients.length || 0)
const selectedCount = computed(() => props.selectedIngredients.size)

// Pre-compute selected map for O(1) lookups
const selectedMap = computed(() => {
  const map = new Map<string, boolean>()
  for (const name of props.selectedIngredients) {
    map.set(name, true)
  }
  return map
})

// Cache all ingredient states to avoid repeated Map.get() calls and string operations per ingredient
// Single lookup per ingredient instead of 6 lookups + multiple string concatenations
const ingredientStates = computed(() => {
  const states = new Map<string, { selected: boolean; containerClass: string; iconClass: string; textClass: string; amountClass: string }>()
  for (const ing of props.recipe.ingredients) {
    const selected = selectedMap.value.get(ing.name) === true
    states.set(ing.name, {
      selected,
      containerClass: selected
        ? 'bg-green-50 dark:bg-green-900/20 line-through opacity-60'
        : 'bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600',
      iconClass: selected ? 'bg-green-500 text-white' : 'border-2 border-gray-300 dark:border-stone-500',
      textClass: selected ? 'text-gray-400' : 'text-gray-900 dark:text-stone-100',
      amountClass: selected ? 'text-gray-400' : 'text-gray-600 dark:text-stone-400',
    })
  }
  return states
})
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
        v-memo="[ingredientStates.get(ing.name)?.selected]"
        class="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer"
        :class="ingredientStates.get(ing.name)?.containerClass"
        @click="emit('toggleIngredient', ing.name)"
      >
        <div
          class="w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center transition-all"
          :class="ingredientStates.get(ing.name)?.iconClass"
        >
          <CheckIcon v-if="ingredientStates.get(ing.name)?.selected" class="w-3 h-3" />
        </div>
        <span class="flex-1 text-sm font-medium" :class="ingredientStates.get(ing.name)?.textClass">
          {{ ing.name }}
        </span>
        <span class="text-xs" :class="ingredientStates.get(ing.name)?.amountClass">
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
        v-memo="[ingredientStates.get(ing.name)?.selected]"
        class="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer"
        :class="ingredientStates.get(ing.name)?.containerClass"
        @click="emit('toggleIngredient', ing.name)"
      >
        <div
          class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
          :class="ingredientStates.get(ing.name)?.iconClass"
        >
          <CheckIcon v-if="ingredientStates.get(ing.name)?.selected" class="w-3 h-3 text-white" />
        </div>
        <span class="flex-1 font-medium" :class="ingredientStates.get(ing.name)?.textClass">{{ ing.name }}</span>
        <span class="text-sm" :class="ingredientStates.get(ing.name)?.amountClass">
          {{ ing.amount }} {{ ing.unit }}
        </span>
      </li>
    </ul>
  </div>
</template>
