<script setup lang="ts">
/**
 * FridgeModeModal - 冰箱模式弹窗组件
 * 
 * 功能：
 * - 食材选择界面
 * - 搜索过滤食材
 * - 多选食材
 * - 快速选择常用食材
 * - 显示匹配结果数量
 */
import type { Recipe } from '~/types'

interface Props {
  visible: boolean
  recipes: Recipe[]
  loading: boolean
  error: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  confirm: [ingredients: string[]]
  randomRecommend: [ingredients: string[]]
}>()

const { t } = useI18n()

// 食材选择状态
const selectedIngredients = ref<string[]>([])
const ingredientSearch = ref('')
const isSelecting = ref(false)

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

// 打开弹窗时初始化
const open = () => {
  isSelecting.value = true
  selectedIngredients.value = []
  ingredientSearch.value = ''
}

watch(() => props.visible, (visible) => {
  if (visible) {
    open()
  }
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

// 关闭弹窗
const handleClose = () => {
  emit('close')
}

// 确认选择
const handleConfirm = () => {
  emit('confirm', selectedIngredients.value)
}

// 随机推荐
const handleRandomRecommend = () => {
  if (selectedIngredients.value.length > 0) {
    emit('randomRecommend', selectedIngredients.value)
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        @click.self="handleClose"
      >
        <!-- 背景遮罩 -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />
        
        <!-- 弹窗内容 -->
        <div
          class="relative w-full sm:max-w-lg max-h-[85vh] bg-white dark:bg-stone-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          <!-- 标题栏 -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-stone-700">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🧊</span>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('fridgeMode.title') }}
              </h2>
            </div>
            <button
              @click="handleClose"
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
              :aria-label="t('common.close')"
            >
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 选择模式：食材选择 -->
          <div v-if="isSelecting && recipes.length === 0" class="flex-1 overflow-y-auto p-6">
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

            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-8">
              <div class="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="text-center py-8 text-red-500">
              {{ error }}
            </div>
          </div>

          <!-- 结果模式：推荐结果 -->
          <div v-else-if="recipes.length > 0 || loading" class="flex-1 overflow-y-auto p-6">
            <div v-if="loading" class="flex flex-col items-center justify-center py-12">
              <div class="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p class="text-gray-500 dark:text-stone-400">{{ t('fridgeMode.finding') }}</p>
            </div>
            <div v-else>
              <p class="text-sm text-gray-500 dark:text-stone-400 mb-4">
                {{ t('fridgeMode.matchedCount', { count: recipes.length }) }}
              </p>
              <div class="space-y-3">
                <button
                  v-for="recipe in recipes.slice(0, 10)"
                  :key="recipe.id"
                  class="w-full p-4 rounded-xl bg-gray-50 dark:bg-stone-700 hover:bg-gray-100 dark:hover:bg-stone-600 transition-colors text-left"
                  @click="navigateTo(`/recipes/${recipe.id}`)"
                >
                  <h3 class="font-medium text-gray-900 dark:text-white">{{ recipe.title }}</h3>
                  <p class="text-sm text-gray-500 dark:text-stone-400 mt-1">
                    {{ recipe.ingredients.length }} {{ t('fridgeMode.ingredients') }}
                  </p>
                </button>
              </div>
              <p v-if="recipes.length > 10" class="text-center text-sm text-gray-400 mt-4">
                {{ t('fridgeMode.moreResults', { count: recipes.length - 10 }) }}
              </p>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else-if="!loading" class="flex-1 flex flex-col items-center justify-center p-6">
            <span class="text-5xl mb-4">🍳</span>
            <p class="text-gray-500 dark:text-stone-400 text-center">
              {{ selectedIngredients.length === 0 ? t('fridgeMode.emptyHint') : t('fridgeMode.noMatch') }}
            </p>
          </div>

          <!-- 底部按钮 -->
          <div class="px-6 py-4 border-t border-gray-100 dark:border-stone-700 bg-gray-50/50 dark:bg-stone-800/50">
            <div class="flex gap-3">
              <button
                @click="handleClose"
                class="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-stone-600 text-gray-700 dark:text-stone-300 font-medium hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                @click="handleConfirm"
                :disabled="selectedIngredients.length === 0"
                class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {{ t('fridgeMode.findRecipes') }}
              </button>
            </div>
            <button
              v-if="selectedIngredients.length > 0"
              @click="handleRandomRecommend"
              class="w-full mt-3 py-2.5 text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              🎲 {{ t('fridgeMode.randomRecommend') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
