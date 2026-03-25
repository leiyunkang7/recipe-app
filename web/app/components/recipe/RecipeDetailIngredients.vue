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

// Pre-compute ingredients with states merged to avoid repeated Map.get() calls in template
// Instead of calling ingredientStates.get(ing.name) 6x per ingredient,
// we access properties directly from the merged object
const ingredientsWithStates = computed(() => {
  return props.recipe.ingredients.map((ing) => {
    const selected = props.selectedIngredients.has(ing.name)
    return {
      ing,
      selected,
      containerClass: selected
        ? 'bg-green-50 dark:bg-green-900/20 line-through opacity-60'
        : 'bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600',
      iconClass: selected ? 'bg-green-500 text-white' : 'border-2 border-gray-300 dark:border-stone-500',
      textClass: selected ? 'text-gray-400' : 'text-gray-900 dark:text-stone-100',
      amountClass: selected ? 'text-gray-400' : 'text-gray-600 dark:text-stone-400',
    }
  })
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
        v-for="{ ing, selected, containerClass, iconClass, textClass, amountClass } in ingredientsWithStates"
        :key="ing.name"
        v-memo="[selected]"
        class="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer"
        :class="containerClass"
        @click="emit('toggleIngredient', ing.name)"
      >
        <div
          class="w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center transition-all"
          :class="iconClass"
        >
          <CheckIcon v-if="selected" class="w-3 h-3" />
        </div>
        <span class="flex-1 text-sm font-medium" :class="textClass">
          {{ ing.name }}
        </span>
        <span class="text-xs" :class="amountClass">
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
        v-for="{ ing, selected, containerClass, iconClass, textClass, amountClass } in ingredientsWithStates"
        :key="ing.name"
        v-memo="[selected]"
        class="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer"
        :class="containerClass"
        @click="emit('toggleIngredient', ing.name)"
      >
        <div
          class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
          :class="iconClass"
        >
          <CheckIcon v-if="selected" class="w-3 h-3 text-white" />
        </div>
        <span class="flex-1 font-medium" :class="textClass">{{ ing.name }}</span>
        <span class="text-sm" :class="amountClass">
          {{ ing.amount }} {{ ing.unit }}
        </span>
      </li>
    </ul>
  </div>
</template>
