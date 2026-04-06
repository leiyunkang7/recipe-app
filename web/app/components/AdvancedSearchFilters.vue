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

const props = defineProps<{
  ingredients: string[]
  maxTime: number | undefined
  minTime: number | undefined
  taste: string[]
  difficulty: 'easy' | 'medium' | 'hard' | undefined
}>()

const emit = defineEmits<{
  'update:ingredients': [string[]]
  'update:maxTime': [number | undefined]
  'update:minTime': [number | undefined]
  'update:taste': [string[]]
  'update:difficulty': ['easy' | 'medium' | 'hard' | undefined]
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

// Local state for inputs
const localIngredients = ref<string[]>([...props.ingredients])
const localMaxTime = ref<number | undefined>(props.maxTime)
const localMinTime = ref<number | undefined>(props.minTime)
const localTaste = ref<string[]>([...props.taste])
const localDifficulty = ref<'easy' | 'medium' | 'hard' | undefined>(props.difficulty)

// Ingredient input
const ingredientInput = ref('')

const addIngredient = () => {
  const trimmed = ingredientInput.value.trim()
  if (trimmed && !localIngredients.value.includes(trimmed)) {
    localIngredients.value.push(trimmed)
    ingredientInput.value = ''
    emitUpdate()
  }
}

const removeIngredient = (index: number) => {
  localIngredients.value.splice(index, 1)
  emitUpdate()
}

const toggleTaste = (taste: string) => {
  const index = localTaste.value.indexOf(taste)
  if (index === -1) {
    localTaste.value.push(taste)
  } else {
    localTaste.value.splice(index, 1)
  }
  emitUpdate()
}

const setDifficulty = (diff: 'easy' | 'medium' | 'hard' | undefined) => {
  localDifficulty.value = diff
  emitUpdate()
}

const setMaxTime = (time: number | undefined) => {
  localMaxTime.value = time
  emitUpdate()
}

const setMinTime = (time: number | undefined) => {
  localMinTime.value = time
  emitUpdate()
}

const emitUpdate = () => {
  emit('update:ingredients', [...localIngredients.value])
  emit('update:maxTime', localMaxTime.value)
  emit('update:minTime', localMinTime.value)
  emit('update:taste', [...localTaste.value])
  emit('update:difficulty', localDifficulty.value)
  emit('apply')
}

const handleClear = () => {
  localIngredients.value = []
  localMaxTime.value = undefined
  localMinTime.value = undefined
  localTaste.value = []
  localDifficulty.value = undefined
  emit('clear')
}

// Sync with props when they change externally
watch(() => props.ingredients, (val) => { localIngredients.value = [...val] })
watch(() => props.maxTime, (val) => { localMaxTime.value = val })
watch(() => props.minTime, (val) => { localMinTime.value = val })
watch(() => props.taste, (val) => { localTaste.value = [...val] })
watch(() => props.difficulty, (val) => { localDifficulty.value = val })

const hasActiveFilters = computed(() => {
  return localIngredients.value.length > 0 ||
    localMaxTime.value !== undefined ||
    localMinTime.value !== undefined ||
    localTaste.value.length > 0 ||
    localDifficulty.value !== undefined
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
            class="hover:text-orange-900 dark:hover:text-orange-100"
            @click="removeIngredient(idx)"
          >
            ×
          </button>
        </span>
      </div>
      <div class="flex gap-2">
        <input
          v-model="ingredientInput"
          type="text"
          :placeholder="t('filter.addIngredient')"
          class="flex-1 px-3 py-2 border border-gray-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          @keydown.enter.prevent="addIngredient"
        />
        <button
          type="button"
          class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors"
          @click="addIngredient"
        >
          {{ t('filter.add') }}
        </button>
      </div>
    </div>

    <!-- Time Range -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
        {{ t('filter.cookingTime') }}
      </label>
      <div class="flex items-center gap-2 flex-wrap">
        <select
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
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
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
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
            localTaste.includes(opt.value)
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'
          ]"
          @click="toggleTaste(opt.value)"
        >
          <span>{{ opt.emoji }}</span>
          {{ t(opt.labelKey) }}
        </button>
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
