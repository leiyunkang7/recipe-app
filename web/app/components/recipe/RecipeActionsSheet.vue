<script setup lang="ts">
/**
 * RecipeActionsSheet - 食谱操作 Bottom Sheet
 * 
 * 在移动端以 BottomSheet 形式展示食谱的可执行操作：
 * - 添加到收藏
 * - 开始烹饪模式
 * - 分享食谱
 * - 添加到购物清单
 * - 调整份量
 */

interface Props {
  visible: boolean
  recipe: {
    id: string
    title: string
    servings: number
    isFavorite?: boolean
  } | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  'start-cooking': []
  'add-to-favorites': []
  'remove-from-favorites': []
  'share-recipe': []
  'add-to-shopping-list': []
  'scale-servings': [servings: number]
}>()

const { t } = useI18n()

const scaledServings = ref(props.recipe?.servings ?? 2)

watch(() => props.recipe, (recipe) => {
  if (recipe) {
    scaledServings.value = recipe.servings
  }
}, { immediate: true })

const handleClose = () => {
  emit('close')
}

const actions = computed(() => [
  {
    id: 'cooking',
    icon: '👨‍🍳',
    label: t('recipe.startCookingMode'),
    description: t('recipe.cookingModeDescription'),
    primary: true,
    onClick: () => {
      emit('start-cooking')
      handleClose()
    },
  },
  {
    id: 'favorite',
    icon: props.recipe?.isFavorite ? '❤️' : '🤍',
    label: props.recipe?.isFavorite 
      ? t('recipe.removeFromFavorites') 
      : t('recipe.addToFavorites'),
    color: props.recipe?.isFavorite ? 'text-red-500' : '',
    onClick: () => {
      if (props.recipe?.isFavorite) {
        emit('remove-from-favorites')
      } else {
        emit('add-to-favorites')
      }
      handleClose()
    },
  },
  {
    id: 'share',
    icon: '📤',
    label: t('recipe.shareRecipe'),
    onClick: () => {
      emit('share-recipe')
      handleClose()
    },
  },
  {
    id: 'shopping',
    icon: '🛒',
    label: t('recipe.addToShoppingList'),
    description: t('recipe.shoppingListDescription'),
    onClick: () => {
      emit('add-to-shopping-list')
      handleClose()
    },
  },
])

const scaleOptions = [0.5, 1, 1.5, 2]

const handleScale = (multiplier: number) => {
  if (!props.recipe) return
  scaledServings.value = Math.round(props.recipe.servings * multiplier)
  emit('scale-servings', scaledServings.value)
}
</script>

<template>
  <BottomSheet
    :visible="visible"
    :title="recipe?.title || t('recipe.actions')"
    :snap-points="[25, 50, 85]"
    :default-snap-index="1"
    @close="handleClose"
  >
    <div class="space-y-6 pb-4">
      <!-- 份量调整 -->
      <div v-if="recipe" class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ t('recipe.servings') }}
          </span>
          <span class="text-lg font-semibold text-orange-600">
            {{ scaledServings }} {{ t('recipe.people') }}
          </span>
        </div>
        <div class="flex gap-2">
          <button
            v-for="opt in scaleOptions"
            :key="opt"
            @click="handleScale(opt)"
            class="flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all"
            :class="scaledServings === Math.round(recipe.servings * opt)
              ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
              : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-stone-600 dark:text-gray-300'
            "
          >
            ×{{ opt }}
          </button>
        </div>
      </div>

      <!-- 操作列表 -->
      <div class="space-y-2">
        <button
          v-for="action in actions"
          :key="action.id"
          @click="action.onClick"
          class="w-full flex items-center gap-4 p-4 rounded-xl transition-all"
          :class="action.primary
            ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
            : 'hover:bg-gray-50 dark:hover:bg-stone-700/50'
          "
        >
          <span class="text-2xl">{{ action.icon }}</span>
          <div class="flex-1 text-left">
            <p
              class="font-semibold"
              :class="action.primary ? '' : 'text-gray-900 dark:text-white'"
            >
              {{ action.label }}
            </p>
            <p
              v-if="action.description"
              class="text-sm mt-0.5"
              :class="action.primary
                ? 'text-orange-100'
                : 'text-gray-500 dark:text-gray-400'
              "
            >
              {{ action.description }}
            </p>
          </div>
          <svg
            v-if="!action.primary"
            class="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </BottomSheet>
</template>
