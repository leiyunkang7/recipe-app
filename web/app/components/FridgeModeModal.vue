<script setup lang="ts">
/**
 * FridgeModeModal - 冰箱模式弹窗组件
 * 
 * 功能：
 * - 弹窗协调逻辑
 * - 食材选择 ↔ 推荐结果切换
 * 
 * 子组件：
 * - FridgeIngredientInput: 食材输入
 * - FridgeRecipeList: 推荐食谱列表
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

// 食材输入组件引用
const ingredientInputRef = ref<InstanceType<typeof FridgeIngredientInput> | null>(null)

// 食材选中状态（双向绑定给子组件）
const selectedIngredients = ref<string[]>([])

// 选择模式标记
const isSelecting = ref(false)

// 打开弹窗时初始化
const open = () => {
  isSelecting.value = true
  selectedIngredients.value = []
  ingredientInputRef.value?.reset()
}

watch(() => props.visible, (visible) => {
  if (visible) {
    open()
  }
})

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
            <FridgeIngredientInput
              ref="ingredientInputRef"
              v-model:selectedIngredients="selectedIngredients"
            />

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
            <FridgeRecipeList :recipes="recipes" :loading="loading" />
          </div>

          <!-- 空状态 -->
          <FridgeEmptyState
            v-else-if="!loading"
            :has-ingredients="selectedIngredients.length > 0"
            @add-ingredient="isSelecting = true"
          />

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
