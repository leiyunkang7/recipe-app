<script setup lang="ts">
/**
 * RecipeDetailIngredients - 食谱详情页食材列表组件
 *
 * 功能：
 * - 响应式布局 (移动端/桌面端)
 * - 食材勾选状态管理
 * - 点击切换勾选状态
 * - 显示已选/总数计数
 * - 预计算样式优化
 *
 * 使用方式：
 * <RecipeDetailIngredients
 *   :recipe="recipe"
 *   :selected-ingredients="selected"
 *   @toggle-ingredient="toggle"
 * />
 */
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

const totalIngredients = computed(() => props.recipe?.ingredients?.length ?? 0)
const selectedCount = computed(() => props.selectedIngredients.size)

// Pre-compute ingredients with states merged to avoid repeated Map.get() calls in template
const ingredientsWithStates = computed(() => {
  return (props.recipe.ingredients ?? []).map((ing) => {
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

// Base classes shared between mobile and desktop
const baseClass = 'bg-white dark:bg-stone-800'
const headingBaseClass = 'font-bold text-gray-900 dark:text-stone-100 flex items-center gap-2'
const itemBaseClass = 'flex items-center gap-3 cursor-pointer transition-all duration-200'
const iconBaseClass = 'flex items-center justify-center transition-all'

// Pre-computed responsive classes
const mobileClasses = {
  wrapper: `${baseClass} rounded-2xl shadow-sm p-4`,
  heading: `${headingBaseClass} text-lg mb-3`,
  counter: 'text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full',
  list: 'space-y-2',
  item: `${itemBaseClass} p-2.5 rounded-xl`,
  iconContainer: 'w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg',
  textLayout: 'flex-1 text-sm font-medium',
}

const desktopClasses = {
  wrapper: `${baseClass} rounded-xl shadow-md dark:shadow-stone-900/30 p-6`,
  heading: `${headingBaseClass} text-2xl mb-4`,
  counter: '',
  list: 'space-y-3',
  item: `${itemBaseClass} p-3 rounded-lg transition-colors`,
  iconContainer: 'w-5 h-5 rounded border-2',
  textLayout: 'flex-1 font-medium',
}

// Use computed to select the appropriate class set
const classes = computed(() => props.isMobile ? mobileClasses : desktopClasses)
</script>

<template>
  <div :class="classes.wrapper">
    <div :class="isMobile ? 'flex items-center justify-between mb-3' : 'mb-4'">
      <h2 :class="classes.heading">
        🛒 {{ t('recipe.ingredients') }}
      </h2>
      <span v-if="isMobile && totalIngredients > 0" :class="classes.counter">
        {{ selectedCount }}/{{ totalIngredients }}
      </span>
    </div>
    <ul :class="classes.list">
      <li
        v-for="{ ing, selected, containerClass, iconClass, textClass, amountClass } in ingredientsWithStates"
        :key="ing.name"
        v-memo="[selected]"
        class="flex items-center gap-3 cursor-pointer transition-all duration-200"
        :class="[containerClass, classes.item]"
        @click="emit('toggleIngredient', ing.name)"
      >
        <div
          :class="[classes.iconContainer, iconClass]"
        >
          <CheckIcon v-if="selected" class="w-3 h-3" />
        </div>
        <span :class="[textClass, classes.textLayout]">
          {{ ing.name }}
        </span>
        <span :class="amountClass">
          {{ ing.amount }} {{ ing.unit }}
        </span>
      </li>
    </ul>
  </div>
</template>
