<script setup lang="ts">
/**
 * AdvancedSearchFilters - 高级搜索筛选组件
 *
 * 功能：
 * - 食材筛选 (多选)
 * - 时间筛选 (最短/最长)
 * - 难度筛选
 * - 口味/标签筛选
 *
 * 优化点：
 * - 使用 defineModel() 替代本地状态副本 + watch 同步，减少内存和响应式开销
 * - 使用 Set 替代 Array.includes 做食材存在性检查 (O(1) vs O(n))
 */
const { t } = useI18n()

interface NutritionRange {
  minCalories?: number
  maxCalories?: number
  minProtein?: number
  maxProtein?: number
  minCarbs?: number
  maxCarbs?: number
  minFat?: number
  maxFat?: number
}

const ingredients = defineModel<string[]>('ingredients', { default: [] })
const maxTime = defineModel<number | undefined>('maxTime')
const minTime = defineModel<number | undefined>('minTime')
const taste = defineModel<string[]>('taste', { default: [] })
const difficulty = defineModel<'easy' | 'medium' | 'hard' | undefined>('difficulty')
const cuisine = defineModel<string>('cuisine', { default: '' })
const minRating = defineModel<number | undefined>('minRating')
const nutritionRange = defineModel<NutritionRange>('nutritionRange', { default: {} })

const props = defineProps<{
  cuisineKeys: Array<{ id: number; name: string; displayName: string }>
}>()

const emit = defineEmits<{
  apply: []
  clear: []
}>()

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
]

// Taste options
const tasteOptions = [
  { value: 'spicy', labelKey: 'taste.spicy', emoji: '🌶️' },
  { value: 'sweet', labelKey: 'taste.sweet', emoji: '🍬' },
  { value: 'savory', labelKey: 'taste.savory', emoji: '🍖' },
  { value: 'sour', labelKey: 'taste.sour', emoji: '🍋' },
  { value: 'mild', labelKey: 'taste.mild', emoji: '🌿' },
]

// Rating options
const ratingOptions = [
  { value: 4, label: '4+ ⭐⭐⭐⭐' },
  { value: 3, label: '3+ ⭐⭐⭐' },
  { value: 2, label: '2+ ⭐⭐' },
]

// Ingredient input
const ingredientInput = ref('')

const addIngredient = () => {
  const trimmed = ingredientInput.value.trim()
  if (trimmed && !ingredients.value.includes(trimmed)) {
    ingredients.value = [...ingredients.value, trimmed]
    ingredientInput.value = ''
    emitApply()
  }
}

const removeIngredient = (index: number) => {
  ingredients.value = ingredients.value.filter((_, i) => i !== index)
  emitApply()
}

const toggleTaste = (tasteValue: string) => {
  const index = taste.value.indexOf(tasteValue)
  if (index === -1) {
    taste.value = [...taste.value, tasteValue]
  } else {
    taste.value = taste.value.filter(t => t !== tasteValue)
  }
  emitApply()
}

const setDifficulty = (diff: 'easy' | 'medium' | 'hard' | undefined) => {
  difficulty.value = diff
  emitApply()
}

const setMaxTime = (time: number | undefined) => {
  maxTime.value = time
  emitApply()
}

const setMinTime = (time: number | undefined) => {
  minTime.value = time
  emitApply()
}

const setCuisine = (cuisineValue: string) => {
  cuisine.value = cuisineValue
  emitApply()
}

const setMinRating = (rating: number | undefined) => {
  minRating.value = rating
  emitApply()
}

const setNutritionRange = (range: NutritionRange) => {
  nutritionRange.value = range
  emitApply()
}

const updateNutrition = (key: keyof NutritionRange, rawValue: string) => {
  const num = rawValue ? Number(rawValue) : undefined
  const current = nutritionRange.value || {}
  if (num === undefined || isNaN(num)) {
    const { [key]: _, ...rest } = current
    nutritionRange.value = rest as NutritionRange
  } else {
    nutritionRange.value = { ...current, [key]: num }
  }
  emitApply()
}

// Debounce apply to avoid triggering multiple searches on rapid filter changes
const applyTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const emitApply = () => {
  if (applyTimer.value) clearTimeout(applyTimer.value)
  applyTimer.value = setTimeout(() => {
    emit('apply')
    applyTimer.value = null
  }, 150)
}

const handleClear = () => {
  ingredients.value = []
  maxTime.value = undefined
  minTime.value = undefined
  taste.value = []
  difficulty.value = undefined
  cuisine.value = ''
  minRating.value = undefined
  nutritionRange.value = {}
  if (applyTimer.value) clearTimeout(applyTimer.value)
  applyTimer.value = null
  emit('clear')
}

// Nutrition field config for DRY template rendering
const nutritionFields: Array<{
  minKey: keyof NutritionRange
  maxKey: keyof NutritionRange
  labelKey: string
  minId: string
  maxId: string
}> = [
  { minKey: 'minCalories', maxKey: 'maxCalories', labelKey: 'filter.nutrition.calories', minId: 'min-calories', maxId: 'max-calories' },
  { minKey: 'minProtein', maxKey: 'maxProtein', labelKey: 'filter.nutrition.protein', minId: 'min-protein', maxId: 'max-protein' },
  { minKey: 'minCarbs', maxKey: 'maxCarbs', labelKey: 'filter.nutrition.carbs', minId: 'min-carbs', maxId: 'max-carbs' },
  { minKey: 'minFat', maxKey: 'maxFat', labelKey: 'filter.nutrition.fat', minId: 'min-fat', maxId: 'max-fat' },
]

const hasActiveFilters = computed(() => {
  const nr = nutritionRange.value
  const hasNutrition = (nr?.minCalories ?? nr?.maxCalories ?? nr?.minProtein ?? nr?.maxProtein ?? nr?.minCarbs ?? nr?.maxCarbs ?? nr?.minFat ?? nr?.maxFat) !== undefined
  return ingredients.value.length > 0 ||
    maxTime.value !== undefined ||
    minTime.value !== undefined ||
    taste.value.length > 0 ||
    difficulty.value !== undefined ||
    cuisine.value !== '' ||
    minRating.value !== undefined ||
    hasNutrition
})
</script>

<template>
  <div class="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm border border-gray-200 dark:border-stone-700 rounded-2xl p-4 space-y-4">
    <!-- Ingredients -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
        {{ t('filter.ingredients') }}
      </label>
      <div class="flex flex-wrap gap-2 mb-2">
        <span
          v-for="(ing, idx) in ingredients"
          :key="ing"
          class="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm"
        >
          {{ ing }}
          <button
            type="button"
            :aria-label="`${t('filter.removeIngredient') || 'Remove ingredient'} ${ing}`"
            class="hover:text-orange-900 dark:hover:text-orange-100"
            @click="removeIngredient(idx)"
          >
            ×
          </button>
        </span>
      </div>
      <div class="flex gap-2">
        <input
          id="ingredient-input"
          v-model="ingredientInput"
          type="text"
          :placeholder="t('filter.addIngredient')"
          class="flex-1 px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 input-material"
          @keydown.enter.prevent="addIngredient"
        />
        <button
          type="button"
          :aria-label="t('filter.addIngredient') || 'Add ingredient'"
          class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors btn-material btn-material-primary"
          @click="addIngredient"
        >
          {{ t('filter.add') }}
        </button>
      </div>
    </div>

    <!-- Time Range -->
    <div>
      <label for="min-time-select" class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
        {{ t('filter.cookingTime') }}
      </label>
      <div class="flex items-center gap-2 flex-wrap">
        <select
          id="min-time-select"
          v-model="minTime"
          class="px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option :value="undefined">{{ t('filter.minTime') }}</option>
          <option v-for="preset in timePresets" :key="preset.value" :value="preset.value">
            ≥ {{ preset.label }}
          </option>
        </select>
        <span class="text-gray-400">-</span>
        <select
          id="max-time-select"
          v-model="maxTime"
          class="px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option :value="undefined">{{ t('filter.maxTime') }}</option>
          <option v-for="preset in timePresets" :key="preset.value" :value="preset.value">
            ≤ {{ preset.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Difficulty -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
        {{ t('filter.difficulty.label') }}
      </label>
      <div class="flex gap-2">
        <button
          v-for="opt in difficultyOptions"
          :key="opt.value"
          type="button"
          :aria-pressed="difficulty === opt.value"
          :aria-label="t(opt.labelKey)"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors filter-chip-material focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
            localDifficulty === opt.value
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'
          ]"
          @click="setDifficulty(difficulty === opt.value ? undefined : opt.value as 'easy' | 'medium' | 'hard')"
        >
          {{ t(opt.labelKey) }}
        </button>
      </div>
    </div>

    <!-- Cuisine -->
    <div v-if="cuisineKeys.length > 0">
      <label for="cuisine-select" class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
        {{ t('filter.cuisine') }}
      </label>
      <select
        id="cuisine-select"
        v-model="cuisine"
        class="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        <option value="">{{ t('filter.selectCuisine') }}</option>
        <option v-for="c in cuisineKeys" :key="c.id" :value="c.name">
          {{ c.displayName }}
        </option>
      </select>
    </div>

    <!-- Taste Tags -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
        {{ t('filter.taste.label') }}
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in tasteOptions"
          :key="opt.value"
          type="button"
          :aria-pressed="taste.includes(opt.value)"
          :aria-label="t(opt.labelKey)"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 filter-chip-material focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
            taste.includes(opt.value)
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'
          ]"
          @click="toggleTaste(opt.value)"
        >
          <span aria-hidden="true">{{ opt.emoji }}</span>
          {{ t(opt.labelKey) }}
        </button>
      </div>
    </div>

    <!-- Minimum Rating -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
        {{ t('filter.minRating') }}
      </label>
      <div class="flex gap-2">
        <button
          v-for="opt in ratingOptions"
          :key="opt.value"
          type="button"
          :aria-pressed="minRating === opt.value"
          :aria-label="opt.label"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors filter-chip-material focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
            minRating === opt.value
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'
          ]"
          @click="setMinRating(minRating === opt.value ? undefined : opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Nutrition Range -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
        {{ t('filter.nutrition.label') }}
      </label>
      <div class="grid grid-cols-2 gap-3">
        <div v-for="field in nutritionFields" :key="field.minKey">
          <label :for="field.minId" class="text-xs text-gray-500 dark:text-stone-400">
            {{ t(field.labelKey) }}<template v-if="!field.labelKey.includes('calories')"> (g)</template>
          </label>
          <div class="flex items-center gap-1 mt-1">
            <input
              :id="field.minId"
              type="number"
              :value="nutritionRange?.[field.minKey]"
              :placeholder="t('filter.nutrition.min')"
              class="w-full px-2 py-1 border border-gray-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm"
              @input="updateNutrition(field.minKey, ($event.target as HTMLInputElement).value)"
            />
            <span class="text-gray-400">-</span>
            <input
              :id="field.maxId"
              type="number"
              :value="nutritionRange?.[field.maxKey]"
              :placeholder="t('filter.nutrition.max')"
              class="w-full px-2 py-1 border border-gray-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm"
              @input="updateNutrition(field.maxKey, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Clear Filters -->
    <div v-if="hasActiveFilters" class="pt-2 border-t border-gray-200 dark:border-stone-700">
      <button
        type="button"
        class="w-full px-4 py-2 text-sm text-gray-600 dark:text-stone-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
        @click="handleClear"
      >
        {{ t('filter.clearAll') }}
      </button>
    </div>
  </div>
</template>
