<script setup lang="ts">
/**
 * RecipeFilters - 食谱多维度筛选栏组件
 *
 * 功能：
 * - 分类筛选 (横向滚动)
 * - 时间筛选 (快捷预设)
 * - 难度筛选
 *
 * 与 useHomePage composable 集成，支持响应式布局
 */

interface Category {
  id: number
  name: string
  displayName: string
}

interface Props {
  categories: Category[]
  selectedCategory: string
  selectedDifficulty: 'easy' | 'medium' | 'hard' | undefined
  maxTime: number | undefined
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:selectedCategory': [string]
  'update:selectedDifficulty': ['easy' | 'medium' | 'hard' | undefined]
  'update:maxTime': [number | undefined]
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

// Local state for immediate UI updates
const localCategory = ref(props.selectedCategory)
const localDifficulty = ref(props.selectedDifficulty)
const localMaxTime = ref(props.maxTime)

// Sync with props
watch(() => props.selectedCategory, (val) => { localCategory.value = val })
watch(() => props.selectedDifficulty, (val) => { localDifficulty.value = val })
watch(() => props.maxTime, (val) => { localMaxTime.value = val })

// Category selection
const selectCategory = (category: string) => {
  localCategory.value = category
  emit('update:selectedCategory', category)
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

// Check if any filter is active
const hasActiveFilters = computed(() => {
  return localCategory.value !== '' ||
    localDifficulty.value !== undefined ||
    localMaxTime.value !== undefined
})

// Clear all filters
const clearAll = () => {
  localCategory.value = ''
  localDifficulty.value = undefined
  localMaxTime.value = undefined
  emit('update:selectedCategory', '')
  emit('update:selectedDifficulty', undefined)
  emit('update:maxTime', undefined)
}

// Base button classes
const BASE_DIFFICULTY_CLASS = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 filter-chip-material'
</script>

<template>
  <div class="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm border border-gray-200 dark:border-stone-700 rounded-xl p-3 space-y-3">
    <!-- Categories Row -->
    <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide">
      <span class="shrink-0 text-xs font-medium text-gray-500 dark:text-stone-400">
        {{ t('filter.category') }}:
      </span>
      <button
        @click="selectCategory('')"
        class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
        :class="localCategory === ''
          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200 dark:shadow-orange-900/30'
          : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'"
      >
        {{ t('search.allCategories') }}
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="selectCategory(cat.name)"
        class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
        :class="localCategory === cat.name
          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200 dark:shadow-orange-900/30'
          : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'"
      >
        {{ cat.displayName }}
      </button>
    </div>

    <!-- Time & Difficulty Row -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Time Presets -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-gray-500 dark:text-stone-400">
          {{ t('filter.cookingTime') }}:
        </span>
        <div class="flex gap-1">
          <button
            v-for="preset in timePresets"
            :key="preset.value"
            @click="selectMaxTime(localMaxTime === preset.value ? undefined : preset.value)"
            class="px-2.5 py-1 rounded text-xs font-medium transition-all"
            :class="localMaxTime === preset.value
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div class="hidden sm:block w-px h-4 bg-gray-200 dark:bg-stone-600" />

      <!-- Difficulty -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-gray-500 dark:text-stone-400">
          {{ t('filter.difficulty.label') }}:
        </span>
        <div class="flex gap-1">
          <button
            v-for="opt in difficultyOptions"
            :key="opt.value"
            @click="selectDifficulty(localDifficulty === opt.value ? undefined : opt.value)"
            class="transition-all"
            :class="[
              BASE_DIFFICULTY_CLASS,
              localDifficulty === opt.value
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'
            ]"
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
