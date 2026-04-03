<script setup lang="ts">
/**
 * FridgeIngredientInput - 食材输入子组件
 * 
 * 功能：
 * - 食材搜索过滤
 * - 快捷食材多选
 * - 已选食材管理
 */
const { t } = useI18n()

// 食材选择状态
const selectedIngredients = defineModel<string[]>('selectedIngredients', { default: () => [] })
const ingredientSearch = ref('')

// 常用食材快捷选项
const quickSelectIngredients = ['鸡蛋', '番茄', '鸡肉', '牛肉', '猪肉', '豆腐', '米饭', '面条', '土豆', '洋葱']

// 过滤后的食材列表（用于显示）
const filteredIngredients = computed(() => {
  if (!ingredientSearch.value) return []
  const search = ingredientSearch.value.toLowerCase()
  return quickSelectIngredients.filter(ing => 
    ing.toLowerCase().includes(search)
  )
})

// 添加食材
const addIngredient = (ingredient: string) => {
  if (!selectedIngredients.value.includes(ingredient)) {
    selectedIngredients.value.push(ingredient)
  }
  ingredientSearch.value = ''
}

// 移除食材
const removeIngredient = (ingredient: string) => {
  selectedIngredients.value = selectedIngredients.value.filter(i => i !== ingredient)
}

// 切换食材选中状态
const toggleIngredient = (ingredient: string) => {
  if (selectedIngredients.value.includes(ingredient)) {
    removeIngredient(ingredient)
  } else {
    addIngredient(ingredient)
  }
}

// 全选快捷食材
const selectAllQuick = () => {
  selectedIngredients.value = [...new Set([...selectedIngredients.value, ...quickSelectIngredients])]
}

// 清空选择
const clearAll = () => {
  selectedIngredients.value = []
}

// 重置（弹窗打开时调用）
const reset = () => {
  selectedIngredients.value = []
  ingredientSearch.value = ''
}

defineExpose({ reset })
</script>

<template>
  <div>
    <!-- 提示文字 -->
    <p class="text-sm text-gray-500 dark:text-stone-400 mb-4">
      {{ t('fridgeMode.selectIngredients') }}
    </p>

    <!-- 搜索框 -->
    <div class="relative mb-4">
      <input
        v-model="ingredientSearch"
        type="text"
        :placeholder="t('fridgeMode.searchPlaceholder')"
        class="w-full px-4 py-3 pl-11 rounded-xl bg-gray-50 dark:bg-stone-700 border border-gray-200 dark:border-stone-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>

    <!-- 搜索过滤显示 -->
    <div v-if="ingredientSearch && filteredIngredients.length > 0" class="mb-4">
      <p class="text-xs text-gray-400 mb-2">{{ t('fridgeMode.searchResults') }}</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="ing in filteredIngredients"
          :key="ing"
          @click="addIngredient(ing)"
          class="px-3 py-1.5 text-sm rounded-full border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
        >
          + {{ ing }}
        </button>
      </div>
    </div>

    <!-- 快捷选择 -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs text-gray-400">{{ t('fridgeMode.quickSelect') }}</p>
        <button
          @click="selectAllQuick"
          class="text-xs text-orange-500 hover:text-orange-600"
        >
          {{ t('fridgeMode.selectAll') }}
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="ing in quickSelectIngredients"
          :key="ing"
          @click="toggleIngredient(ing)"
          class="px-3 py-1.5 text-sm rounded-full transition-all"
          :class="selectedIngredients.includes(ing)
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
            : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'"
        >
          {{ ing }}
        </button>
      </div>
    </div>

    <!-- 已选食材 -->
    <div v-if="selectedIngredients.length > 0" class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs text-gray-400">
          {{ t('fridgeMode.selected') }} ({{ selectedIngredients.length }})
        </p>
        <button
          @click="clearAll"
          class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {{ t('common.clear') }}
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="ing in selectedIngredients"
          :key="ing"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300"
        >
          {{ ing }}
          <button
            @click="removeIngredient(ing)"
            class="w-4 h-4 flex items-center justify-center rounded-full hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      </div>
    </div>
  </div>
</template>
