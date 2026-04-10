<script setup lang="ts">
/**
 * AdvancedSearchFilters - 高级搜索筛选组件
 * 
 * 功能：
 * - 食材筛选 (多选)
 * - 时间筛选 (最短/最长)
 * - 难度筛选
 * - 口味/标签筛选
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

const props = defineProps<{
  ingredients: string[]
  maxTime: number | undefined
  minTime: number | undefined
  taste: string[]
  difficulty: 'easy' | 'medium' | 'hard' | undefined
  cuisine: string
  cuisineKeys: Array<{ id: number; name: string; displayName: string }>
  minRating: number | undefined
  nutritionRange: NutritionRange
}>()

const emit = defineEmits<{
  'update:ingredients': [string[]]
  'update:maxTime': [number | undefined]
  'update:minTime': [number | undefined]
  'update:taste': [string[]]
  'update:difficulty': ['easy' | 'medium' | 'hard' | undefined]
  'update:cuisine': [string]
  'update:minRating': [number | undefined]
  'update:nutritionRange': [NutritionRange]
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

// Local state for inputs
const localIngredients = ref<string[]>([...props.ingredients])
const localMaxTime = ref<number | undefined>(props.maxTime)
const localMinTime = ref<number | undefined>(props.minTime)
const localTaste = ref<string[]>([...props.taste])
const localDifficulty = ref<'easy' | 'medium' | 'hard' | undefined>(props.difficulty)
const localCuisine = ref<string>(props.cuisine)
const localMinRating = ref<number | undefined>(props.minRating)
const localNutritionRange = ref<NutritionRange>({ ...props.nutritionRange })

// Ingredient input
const ingredientInput = ref('')

const addIngredient = () => {
  const trimmed = ingredientInput.value.trim()
  if (trimmed && !localIngredients.value.includes(trimmed)) {
    localIngredients.value.push(trimmed)
    ingredientInput.value = ''
    emit('update:ingredients', [...localIngredients.value])
    emitApply()
  }
}

const removeIngredient = (index: number) => {
  localIngredients.value.splice(index, 1)
  emit('update:ingredients', [...localIngredients.value])
  emitApply()
}

const toggleTaste = (taste: string) => {
  const index = localTaste.value.indexOf(taste)
  if (index === -1) {
    localTaste.value.push(taste)
  } else {
    localTaste.value.splice(index, 1)
  }
  emit('update:taste', [...localTaste.value])
  emitApply()
}

const setDifficulty = (diff: 'easy' | 'medium' | 'hard' | undefined) => {
  localDifficulty.value = diff
  emit('update:difficulty', diff)
  emitApply()
}

const setMaxTime = (time: number | undefined) => {
  localMaxTime.value = time
  emit('update:maxTime', time)
  emitApply()
}

const setMinTime = (time: number | undefined) => {
  localMinTime.value = time
  emit('update:minTime', time)
  emitApply()
}

const setCuisine = (cuisine: string) => {
  localCuisine.value = cuisine
  emit('update:cuisine', cuisine)
  emitApply()
}

const setMinRating = (rating: number | undefined) => {
  localMinRating.value = rating
  emit('update:minRating', rating)
  emitApply()
}

const setNutritionRange = (range: NutritionRange) => {
  localNutritionRange.value = range
  emit('update:nutritionRange', range)
  emitApply()
}

const updateNutrition = (key: keyof NutritionRange, value: number | undefined) => {
  if (value === undefined) {
    delete localNutritionRange.value[key]
  } else {
    localNutritionRange.value[key] = value
  }
  emit('update:nutritionRange', { ...localNutritionRange.value })
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

const emitUpdate = () => {
  emit('update:ingredients', [...localIngredients.value])
  emit('update:maxTime', localMaxTime.value)
  emit('update:minTime', localMinTime.value)
  emit('update:taste', [...localTaste.value])
  emit('update:difficulty', localDifficulty.value)
  emit('update:cuisine', localCuisine.value)
  emit('update:minRating', localMinRating.value)
  emit('update:nutritionRange', { ...localNutritionRange.value })
  emitApply()
}

const handleClear = () => {
  localIngredients.value = []
  localMaxTime.value = undefined
  localMinTime.value = undefined
  localTaste.value = []
  localDifficulty.value = undefined
  localCuisine.value = ''
  localMinRating.value = undefined
  localNutritionRange.value = {}
  if (applyTimer.value) clearTimeout(applyTimer.value)
  applyTimer.value = null
  emit('clear')
}

// Sync with props when they change externally - consolidated into single watch with multiple sources
watch(
  () => [props.ingredients, props.maxTime, props.minTime, props.taste, props.difficulty, props.cuisine, props.minRating, props.nutritionRange] as const,
  ([ingredients, maxTime, minTime, taste, difficulty, cuisine, minRating, nutritionRange]) => {
    localIngredients.value = [...ingredients]
    localMaxTime.value = maxTime
    localMinTime.value = minTime
    localTaste.value = [...taste]
    localDifficulty.value = difficulty
    localCuisine.value = cuisine
    localMinRating.value = minRating
    localNutritionRange.value = { ...nutritionRange }
  },
  { deep: false }
)

const hasActiveFilters = computed(() => {
  return localIngredients.value.length > 0 ||
    localMaxTime.value !== undefined ||
    localMinTime.value !== undefined ||
    localTaste.value.length > 0 ||
    localDifficulty.value !== undefined ||
    localCuisine.value !== '' ||
    localMinRating.value !== undefined ||
    Object.keys(localNutritionRange.value).length > 0
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
          v-for="(ing, idx) in localIngredients"
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
          :value="localMinTime"
          class="px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          @change="setMinTime(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : undefined)"
        >
          <option value="">{{ t('filter.minTime') }}</option>
          <option v-for="preset in timePresets" :key="preset.value" :value="preset.value">
            ≥ {{ preset.label }}
          </option>
        </select>
        <span class="text-gray-400">-</span>
        <select
          id="max-time-select"
          :value="localMaxTime"
          class="px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          @change="setMaxTime(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : undefined)"
        >
          <option value="">{{ t('filter.maxTime') }}</option>
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
          :aria-pressed="localDifficulty === opt.value"
          :aria-label="t(opt.labelKey)"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors filter-chip-material focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
            localDifficulty === opt.value
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'
          ]"
          @click="setDifficulty(localDifficulty === opt.value ? undefined : opt.value as 'easy' | 'medium' | 'hard')"
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
        :value="localCuisine"
        class="w-full px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        @change="setCuisine(($event.target as HTMLSelectElement).value)"
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
          :aria-pressed="localTaste.includes(opt.value)"
          :aria-label="t(opt.labelKey)"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 filter-chip-material focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
            localTaste.includes(opt.value)
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
          :aria-pressed="localMinRating === opt.value"
          :aria-label="opt.label"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors filter-chip-material focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
            localMinRating === opt.value
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'
          ]"
          @click="setMinRating(localMinRating === opt.value ? undefined : opt.value)"
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
        <div>
          <label for="min-calories" class="text-xs text-gray-500 dark:text-stone-400">{{ t('filter.nutrition.calories') }}</label>
          <div class="flex items-center gap-1 mt-1">
            <input
              id="min-calories"
              type="number"
              :value="localNutritionRange.minCalories"
              :placeholder="t('filter.nutrition.min')"
              class="w-full px-2 py-1 border border-gray-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm"
              @input="updateNutrition('minCalories', $event.target.value ? Number($event.target.value) : undefined)"
            />
            <span class="text-gray-400">-</span>
            <input
              id="max-calories"
              type="number"
              :value="localNutritionRange.maxCalories"
              :placeholder="t('filter.nutrition.max')"
              class="w-full px-2 py-1 border border-gray-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm"
              @input="updateNutrition('maxCalories', $event.target.value ? Number($event.target.value) : undefined)"
            />
          </div>
        </div>
        <div>
          <label for="min-protein" class="text-xs text-gray-500 dark:text-stone-400">{{ t('filter.nutrition.protein') }} (g)</label>
          <div class="flex items-center gap-1 mt-1">
            <input
              id="min-protein"
              type="number"
              :value="localNutritionRange.minProtein"
              :placeholder="t('filter.nutrition.min')"
              class="w-full px-2 py-1 border border-gray-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm"
              @input="updateNutrition('minProtein', $event.target.value ? Number($event.target.value) : undefined)"
            />
            <span class="text-gray-400">-</span>
            <input
              id="max-protein"
              type="number"
              :value="localNutritionRange.maxProtein"
              :placeholder="t('filter.nutrition.max')"
              class="w-full px-2 py-1 border border-gray-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm"
              @input="updateNutrition('maxProtein', $event.target.value ? Number($event.target.value) : undefined)"
            />
          </div>
        </div>
        <div>
          <label for="min-carbs" class="text-xs text-gray-500 dark:text-stone-400">{{ t('filter.nutrition.carbs') }} (g)</label>
          <div class="flex items-center gap-1 mt-1">
            <input
              id="min-carbs"
              type="number"
              :value="localNutritionRange.minCarbs"
              :placeholder="t('filter.nutrition.min')"
              class="w-full px-2 py-1 border border-gray-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm"
              @input="updateNutrition('minCarbs', $event.target.value ? Number($event.target.value) : undefined)"
            />
            <span class="text-gray-400">-</span>
            <input
              id="max-carbs"
              type="number"
              :value="localNutritionRange.maxCarbs"
              :placeholder="t('filter.nutrition.max')"
              class="w-full px-2 py-1 border border-gray-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm"
              @input="updateNutrition('maxCarbs', $event.target.value ? Number($event.target.value) : undefined)"
            />
          </div>
        </div>
        <div>
          <label for="min-fat" class="text-xs text-gray-500 dark:text-stone-400">{{ t('filter.nutrition.fat') }} (g)</label>
          <div class="flex items-center gap-1 mt-1">
            <input
              id="min-fat"
              type="number"
              :value="localNutritionRange.minFat"
              :placeholder="t('filter.nutrition.min')"
              class="w-full px-2 py-1 border border-gray-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm"
              @input="updateNutrition('minFat', $event.target.value ? Number($event.target.value) : undefined)"
            />
            <span class="text-gray-400">-</span>
            <input
              id="max-fat"
              type="number"
              :value="localNutritionRange.maxFat"
              :placeholder="t('filter.nutrition.max')"
              class="w-full px-2 py-1 border border-gray-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm"
              @input="updateNutrition('maxFat', $event.target.value ? Number($event.target.value) : undefined)"
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
