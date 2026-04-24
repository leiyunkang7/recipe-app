<script setup lang="ts">
/**
 * IngredientsBottomSheet - 移动端食材 Bottom Sheet
 *
 * 特性：
 * - 移动端从底部滑出的食材列表
 * - 份量调整器（按比例缩放食材用量）
 * - 食材勾选状态管理
 * - 勾选进度显示（已选/总数）
 * - 弹性拖拽 + snap points
 * - 暗色模式支持
 *
 * 使用方式：
 * <IngredientsBottomSheet
 *   :visible="showIngredients"
 *   :recipe="recipe"
 *   :selected-ingredients="selectedIngredients"
 *   @close="showIngredients = false"
 *   @toggle-ingredient="toggleIngredient"
 *   @update:servings="handleServingsChange"
 * />
 */
import type { Recipe, Ingredient } from '~/types'
import BottomSheet from '~/components/BottomSheet.vue'

interface Props {
  visible: boolean
  recipe: Recipe | null
  selectedIngredients: Set<string>
  scaledServings?: number
}

const props = withDefaults(defineProps<Props>(), {
  scaledServings: 0,
})

const emit = defineEmits<{
  close: []
  'toggle-ingredient': [name: string]
  'update:servings': [servings: number]
}>()

const { t } = useI18n()

// ─── Serving scale ───────────────────────────────────────────────────
const scaleOptions = [0.5, 1, 1.5, 2, 3]

const originalServings = computed(() => props.recipe?.servings ?? 1)

const selectedScaleIndex = ref(1) // default 1x

const scaledServingsDisplay = computed(() => {
  if (props.scaledServings > 0) {
    return props.scaledServings
  }
  return originalServings.value
})

const getScaledAmount = (ing: Ingredient): string => {
  if (typeof ing.amount !== 'number') return String(ing.amount ?? '')
  const scale = scaledServingsDisplay.value / originalServings.value
  const scaled = ing.amount * scale
  // Round to 1 decimal, strip trailing zeros
  return Number(scaled.toFixed(1)).toString()
}

const handleScale = (multiplier: number, index: number) => {
  selectedScaleIndex.value = index
  if (props.recipe) {
    const newServings = Math.round(props.recipe.servings * multiplier)
    emit('update:servings', newServings)
  }
}

// ─── Ingredient states ──────────────────────────────────────────────
const totalIngredients = computed(() => props.recipe?.ingredients?.length ?? 0)
const selectedCount = computed(() => props.selectedIngredients.size)

const ingredientsWithStates = computed(() => {
  return (props.recipe?.ingredients ?? []).map((ing) => {
    const selected = props.selectedIngredients.has(ing.name)
    return {
      ing,
      selected,
      containerClass: selected
        ? 'bg-green-50 dark:bg-green-900/20 line-through opacity-60'
        : 'bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600',
      iconClass: selected ? 'bg-green-500 text-white' : 'border-2 border-gray-300 dark:border-stone-500',
    }
  })
})
</script>

<template>
  <BottomSheet
    :visible="visible"
    :title="t('recipe.ingredients')"
    :snap-points="[40, 75, 90]"
    :default-snap-index="1"
    swipeable
    @close="emit('close')"
  >
    <div class="space-y-4 pb-2">

      <!-- ── Header: serving adjuster + progress ──────────────────── -->
      <div class="space-y-3">
        <!-- Servings label -->
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ t('recipe.servings') }}
          </span>
          <span class="text-base font-bold text-orange-600 dark:text-orange-400">
            {{ scaledServingsDisplay }} {{ t('recipe.people', { count: scaledServingsDisplay }) }}
          </span>
        </div>

        <!-- Scale buttons -->
        <div class="flex gap-2">
          <button
            v-for="(opt, i) in scaleOptions"
            :key="opt"
            @click="handleScale(opt, i)"
            class="flex-1 py-2 px-2 rounded-lg border text-sm font-semibold transition-all active:scale-95"
            :class="selectedScaleIndex === i
              ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
              : 'border-gray-200 text-gray-600 dark:border-stone-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-stone-500'"
          >
            ×{{ opt }}
          </button>
        </div>

        <!-- Progress -->
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 dark:text-gray-500">
            {{ selectedCount }} / {{ totalIngredients }} {{ t('recipe.selected') || '已选' }}
          </span>
          <div class="flex gap-1">
            <div
              v-for="i in totalIngredients"
              :key="i"
              class="w-2 h-2 rounded-full transition-all"
              :class="i <= selectedCount
                ? 'bg-green-500'
                : 'bg-gray-200 dark:bg-stone-600'"
            />
          </div>
        </div>
      </div>

      <!-- ── Divider ──────────────────────────────────────────────── -->
      <div class="border-t border-gray-100 dark:border-stone-700" />

      <!-- ── Ingredient list ──────────────────────────────────────── -->
      <ul class="space-y-2 max-h-[50vh] overflow-y-auto pb-4">
        <li
          v-for="{ ing, selected, containerClass, iconClass } in ingredientsWithStates"
          :key="ing.name"
          class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98]"
          :class="containerClass"
          @click="emit('toggle-ingredient', ing.name)"
        >
          <!-- Checkbox -->
          <div
            class="w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center transition-all"
            :class="iconClass"
          >
            <svg v-if="selected" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <!-- Name -->
          <span
            class="flex-1 text-sm font-medium transition-colors"
            :class="selected
              ? 'text-gray-400 line-through'
              : 'text-gray-900 dark:text-stone-100'"
          >
            {{ ing.name }}
          </span>

          <!-- Amount -->
          <span
            class="text-sm font-semibold tabular-nums"
            :class="selected ? 'text-gray-400' : 'text-gray-600 dark:text-stone-400'"
          >
            {{ getScaledAmount(ing) }}
            <span v-if="ing.unit" class="text-xs ml-0.5">{{ ing.unit }}</span>
          </span>
        </li>
      </ul>
    </div>
  </BottomSheet>
</template>
