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
 */

import type { SortOption } from '~/composables/useRecipeFilters'

interface Category {
  id: number
  name: string
  displayName: string
}

interface Cuisine {
  id: number
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

// Time presets (in minutes)
const timePresets = [
  { label: '15min', value: 15 },
  { label: '30min', value: 30 },
  { label: '60min', value: 60 },
  { label: '90min', value: 90 },
]

// Difficulty options
const difficultyOptions = [
  { value: 'easy', labelKey: 'difficulty.easy' },
  { value: 'medium', labelKey: 'difficulty.medium' },
  { value: 'hard', labelKey: 'difficulty.hard' },
] as const

// Sort options
const sortOptions: Array<{ value: SortOption; labelKey: string }> = [
  { value: 'latest', labelKey: 'sort.latest' },
  { value: 'popular', labelKey: 'sort.popular' },
  { value: 'rating', labelKey: 'sort.highestRated' },
  { value: 'quickest', labelKey: 'sort.quickest' },
]

// Local state for immediate UI updates
const localCategory = ref(props.selectedCategory)
const localCuisine = ref(props.selectedCuisine)
const localDifficulty = ref(props.selectedDifficulty)
const localMaxTime = ref(props.maxTime)
const localSort = ref<SortOption | ''>(props.sort || '')

// Sync with props
watch(() => props.selectedCategory, (val) => { localCategory.value = val })
watch(() => props.selectedCuisine, (val) => { localCuisine.value = val })
watch(() => props.selectedDifficulty, (val) => { localDifficulty.value = val })
watch(() => props.maxTime, (val) => { localMaxTime.value = val })
watch(() => props.sort, (val) => { localSort.value = val || '' })

// Category selection
const selectCategory = (cat: string) => {
  localCategory.value = cat
  emit('update:selectedCategory', cat)
}

// Cuisine selection
const selectCuisine = (c: string) => {
  localCuisine.value = c
  emit('update:selectedCuisine', c)
}

// Difficulty selection
const selectDifficulty = (diff: 'easy' | 'medium' | 'hard' | undefined) => {
  localDifficulty.value = diff
  emit('update:selectedDifficulty', diff)
}

// Time preset selection
const selectMaxTime = (time: number | undefined) => {
  localMaxTime.value = time
  emit('update:maxTime', time)
}

// Sort selection
const selectSort = (s: SortOption | '') => {
  localSort.value = s
  emit('update:sort', s)
}

// Check if any filter is active
const hasActiveFilters = computed(() => {
  return (
    localCategory.value !== '' ||
    localCuisine.value !== '' ||
    localDifficulty.value !== undefined ||
    localMaxTime.value !== undefined ||
    localSort.value !== ''
  )
})

// Clear all filters
const clearAll = () => {
  localCategory.value = ''
  localCuisine.value = ''
  localDifficulty.value = undefined
  localMaxTime.value = undefined
  localSort.value = ''
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
        @click="selectCategory('')"
        class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
        :class="localCategory === '' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200 dark:shadow-orange-900/30' : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'"
        :aria-pressed="localCategory === ''"
      >
        {{ t('search.allCategories') }}
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="selectCategory(cat.name)"
        class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        :class="localCategory === cat.name ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200 dark:shadow-orange-900/30' : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'"
        :aria-pressed="localCategory === cat.name"
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
        @click="selectCuisine('')"
        class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
        :class="localCuisine === '' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200 dark:shadow-orange-900/30' : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'"
        :aria-pressed="localCuisine === ''"
      >
        {{ t('filter.allCuisines') || '全部菜系' }}
      </button>
      <button
        v-for="c in cuisines"
        :key="c.id"
        @click="selectCuisine(c.name)"
        class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        :class="localCuisine === c.name ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200 dark:shadow-orange-900/30' : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'"
        :aria-pressed="localCuisine === c.name"
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
          :value="localSort"
          class="px-3 py-1.5 text-xs bg-gray-100 dark:bg-stone-700 border-0 rounded-lg text-gray-700 dark:text-stone-200 focus:ring-2 focus:ring-orange-500 cursor-pointer"
          @change="selectSort(($event.target as HTMLSelectElement).value as SortOption || '')"
        >
          <option value="">{{ t('sort.default') }}</option>
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
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
            v-for="preset in timePresets"
            :key="preset.value"
            @click="selectMaxTime(localMaxTime === preset.value ? undefined : preset.value)"
            class="px-2.5 py-1 rounded text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            :class="localMaxTime === preset.value ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'"
            :aria-pressed="localMaxTime === preset.value"
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
            v-for="opt in difficultyOptions"
            :key="opt.value"
            @click="selectDifficulty(localDifficulty === opt.value ? undefined : opt.value)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            :class="localDifficulty === opt.value ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'"
            :aria-pressed="localDifficulty === opt.value"
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
