<script setup lang="ts">
/**
 * RecipeFilters - 食谱多维度筛选栏组件（增强版）
 *
 * 功能：
 * - 分类筛选 (横向滚动)
 * - 菜系筛选
 * - 时间筛选 (快捷预设)
 * - 难度筛选
 * - 排序选择
 *
 * 支持响应式布局，URL 参数同步
 *
 * 优化点：
 * - 直接使用 props 作为状态源，无冗余本地状态副本
 * - 提取 chip class 为模板常量，避免每次渲染字符串拼接
 */

import type { SortOption, SORT_OPTIONS } from '~/composables/useRecipeFilters'
import { DIFFICULTY_OPTIONS, TIME_PRESETS } from '~/utils/filterConstants'

interface Category {
  id: string
  name: string
  displayName: string
}

interface Cuisine {
  id: string
  name: string
  displayName: string
}

interface Props {
  categories: Category[]
  cuisines: Cuisine[]
  selectedCategory: string
  selectedCuisine: string
  selectedDifficulty: 'easy' | 'medium' | 'hard' | undefined
  maxTime: number | undefined
  sort?: SortOption | ''
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:selectedCategory': [string]
  'update:selectedCuisine': [string]
  'update:selectedDifficulty': ['easy' | 'medium' | 'hard' | undefined]
  'update:maxTime': [number | undefined]
  'update:sort': [SortOption | '']
}>()

const { t } = useI18n()

// Generic emit-forwarder to avoid 5 nearly identical one-liner functions
const emitUpdate = <K extends keyof Omit<Props, 'categories' | 'cuisines'>>(
  key: K,
  value: Props[K]
) => {
  emit(`update:${key}`, value)
}

// Check if any filter is active - computed directly from props
const hasActiveFilters = computed(() => {
  return (
    props.selectedCategory !== '' ||
    props.selectedCuisine !== '' ||
    props.selectedDifficulty !== undefined ||
    props.maxTime !== undefined ||
    props.sort !== ''
  )
})

// Extracted class helper to avoid duplicating long Tailwind class strings
const chipBaseClass = 'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
const chipActiveClass = 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200 dark:shadow-orange-900/30'
const chipInactiveClass = 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'

const chipClass = (isActive: boolean) => isActive ? `${chipBaseClass} ${chipActiveClass}` : `${chipBaseClass} ${chipInactiveClass}`

// Clear all filters
const clearAll = () => {
  emit('update:selectedCategory', '')
  emit('update:selectedCuisine', '')
  emit('update:selectedDifficulty', undefined)
  emit('update:maxTime', undefined)
  emit('update:sort', '')
}
</script>

<template>
  <div class="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm border border-gray-200 dark:border-stone-700 rounded-xl p-3 space-y-3">
    <!-- Categories Row -->
    <div role="group" aria-labelledby="categories-filter-label" class="flex items-center gap-2 overflow-x-auto scrollbar-hide">
      <span id="categories-filter-label" class="shrink-0 text-xs font-medium text-gray-600 dark:text-stone-400">
        {{ t('filter.category') }}:
      </span>
      <button
        @click="emitUpdate('selectedCategory', '')"
        :class="chipClass(props.selectedCategory === '')"
        :aria-pressed="props.selectedCategory === ''"
      >
        {{ t('search.allCategories') }}
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="emitUpdate('selectedCategory', cat.name)"
        :class="chipClass(props.selectedCategory === cat.name)"
        :aria-pressed="props.selectedCategory === cat.name"
        :aria-label="`${t('filter.category')}: ${cat.displayName}`"
      >
        {{ cat.displayName }}
      </button>
    </div>

    <!-- Cuisine Row -->
    <div v-if="cuisines.length > 0" role="group" aria-labelledby="cuisine-filter-label" class="flex items-center gap-2 overflow-x-auto scrollbar-hide">
      <span id="cuisine-filter-label" class="shrink-0 text-xs font-medium text-gray-600 dark:text-stone-400">
        {{ t('filter.cuisine') }}:
      </span>
      <button
        @click="emitUpdate('selectedCuisine', '')"
        :class="chipClass(props.selectedCuisine === '')"
        :aria-pressed="props.selectedCuisine === ''"
      >
        {{ t('filter.allCuisines') || '全部菜系' }}
      </button>
      <button
        v-for="c in cuisines"
        :key="c.id"
        @click="emitUpdate('selectedCuisine', c.name)"
        :class="chipClass(props.selectedCuisine === c.name)"
        :aria-pressed="props.selectedCuisine === c.name"
        :aria-label="`${t('filter.cuisine')}: ${c.displayName}`"
      >
        {{ c.displayName }}
      </button>
    </div>

    <!-- Sort + Time + Difficulty Row -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Sort Dropdown -->
      <div class="flex items-center gap-2">
        <span id="sort-filter-label" class="text-xs font-medium text-gray-600 dark:text-stone-400">
          {{ t('sort.label') }}:
        </span>
        <select
          id="sort-select"
          :value="props.sort"
          class="px-3 py-1.5 text-xs bg-gray-100 dark:bg-stone-700 border-0 rounded-lg text-gray-700 dark:text-stone-200 focus:ring-2 focus:ring-orange-500 cursor-pointer"
          @change="emitUpdate('sort', ($event.target as HTMLSelectElement).value as SortOption || '')"
        >
          <option value="">{{ t('sort.default') }}</option>
          <option v-for="opt in SORT_OPTIONS" :key="opt.value" :value="opt.value">
            {{ t(opt.labelKey) }}
          </option>
        </select>
      </div>

      <div class="hidden sm:block w-px h-4 bg-gray-200 dark:bg-stone-600" />

      <!-- Time Presets -->
      <div role="group" aria-labelledby="time-filter-label" class="flex items-center gap-2">
        <span id="time-filter-label" class="text-xs font-medium text-gray-600 dark:text-stone-400">
          {{ t('filter.cookingTime') }}:
        </span>
        <div class="flex gap-1" role="group" aria-label="Time presets">
          <button
            v-for="preset in TIME_PRESETS"
            :key="preset.value"
            @click="emitUpdate('maxTime', props.maxTime === preset.value ? undefined : preset.value)"
            :class="chipClass(props.maxTime === preset.value)"
            :aria-pressed="props.maxTime === preset.value"
            :aria-label="`${preset.label} ${t('filter.cookingTime')}`"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <div class="hidden sm:block w-px h-4 bg-gray-200 dark:bg-stone-600" />

      <!-- Difficulty -->
      <div role="group" aria-labelledby="difficulty-filter-label" class="flex items-center gap-2">
        <span id="difficulty-filter-label" class="text-xs font-medium text-gray-500 dark:text-stone-400">
          {{ t('filter.difficulty.label') }}:
        </span>
        <div class="flex gap-1" role="group" aria-label="Difficulty options">
          <button
            v-for="opt in DIFFICULTY_OPTIONS"
            :key="opt.value"
            @click="emitUpdate('selectedDifficulty', props.selectedDifficulty === opt.value ? undefined : opt.value)"
            :class="chipClass(props.selectedDifficulty === opt.value)"
            :aria-pressed="props.selectedDifficulty === opt.value"
            :aria-label="`${t('filter.difficulty.label')}: ${t(opt.labelKey)}`"
          >
            {{ t(opt.labelKey) }}
          </button>
        </div>
      </div>

      <!-- Clear All -->
      <button
        v-if="hasActiveFilters"
        @click="clearAll"
        class="ml-auto px-3 py-1.5 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
        :aria-label="t('filter.clearAll')"
      >
        {{ t('filter.clearAll') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
