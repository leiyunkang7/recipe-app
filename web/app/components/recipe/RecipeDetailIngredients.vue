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

// Consolidate responsive styles into computed classes
const wrapperClass = computed(() => {
  const base = 'bg-white dark:bg-stone-800'
  return props.isMobile
    ? `${base} rounded-2xl shadow-sm p-4`
    : `${base} rounded-xl shadow-md dark:shadow-stone-900/30 p-6`
})

const headingClass = computed(() => {
  const base = 'font-bold text-gray-900 dark:text-stone-100 flex items-center gap-2'
  return props.isMobile ? `text-lg mb-3` : `text-2xl mb-4`
})

const counterClass = computed(() => {
  return props.isMobile ? 'text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full' : ''
})

const listClass = computed(() => props.isMobile ? 'space-y-2' : 'space-y-3')

const itemClass = computed(() => props.isMobile ? 'flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer' : 'flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer')

const iconContainerClass = computed(() => {
  return props.isMobile
    ? 'w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center transition-all'
    : 'w-5 h-5 rounded border-2 flex items-center justify-center transition-all'
})

const textLayoutClass = computed(() => props.isMobile ? 'flex-1 text-sm font-medium' : 'flex-1 font-medium')

const amountSizeClass = computed(() => props.isMobile ? 'text-xs' : 'text-sm')
</script>

<template>
  <div :class="wrapperClass">
    <div :class="isMobile ? 'flex items-center justify-between mb-3' : 'mb-4'">
      <h2 :class="headingClass">
        🛒 {{ t('recipe.ingredients') }}
      </h2>
      <span v-if="isMobile && totalIngredients > 0" :class="counterClass">
        {{ selectedCount }}/{{ totalIngredients }}
      </span>
    </div>
    <ul :class="listClass">
      <li
        v-for="{ ing, selected, containerClass, iconClass, textClass, amountClass } in ingredientsWithStates"
        :key="ing.name"
        v-memo="[selected]"
        class="flex items-center gap-3 cursor-pointer transition-all duration-200"
        :class="[containerClass, itemClass]"
        @click="emit('toggleIngredient', ing.name)"
      >
        <div
          :class="[iconContainerClass, iconClass]"
        >
          <CheckIcon v-if="selected" class="w-3 h-3" />
        </div>
        <span :class="[textClass, textLayoutClass]">
          {{ ing.name }}
        </span>
        <span :class="[amountClass, amountSizeClass]">
          {{ ing.amount }} {{ ing.unit }}
        </span>
      </li>
    </ul>
  </div>
</template>
