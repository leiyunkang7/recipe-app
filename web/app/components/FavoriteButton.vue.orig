<script setup lang="ts">
/**
 * FavoriteButton - 收藏按钮组件
 *
 * 功能：
 * - 切换食谱收藏状态
 * - 点击动画反馈
 * - 支持多种尺寸 (sm, md, lg)
 * - 可选显示文字标签
 *
 * 使用方式：
 * <FavoriteButton recipe-id="123" size="md" show-label />
 */
import type { SizeVariant } from '~/types/component-props'
import { SIZE_CLASSES } from '~/types/component-props'

interface Props {
  recipeId: string
  size?: SizeVariant
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showLabel: false,
})

const buttonClasses = computed(() => SIZE_CLASSES[props.size])

const { isFavorite, toggleFavorite } = useFavorites()
const { t } = useI18n()

// Cache isFavorite result to avoid multiple function calls in template
const cachedIsFavorite = computed(() => isFavorite(props.recipeId))

const isAnimating = ref(false)
const animatingTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const handleClick = async (e: Event) => {
  e.preventDefault()
  e.stopPropagation()

  isAnimating.value = true
  await toggleFavorite(props.recipeId)

  if (animatingTimer.value) {
    clearTimeout(animatingTimer.value)
  }
  animatingTimer.value = setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

onBeforeUnmount(() => {
  if (animatingTimer.value) {
    clearTimeout(animatingTimer.value)
    animatingTimer.value = null
  }
})

const iconSizes: Record<SizeVariant, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}
</script>

<template>
  <button
    @click="handleClick"
    :class="[
      'favorite-btn flex items-center justify-center rounded-full transition-all duration-300',
      buttonClasses.button,
      cachedIsFavorite
        ? 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40'
        : 'bg-white/90 dark:bg-stone-800/90 text-gray-400 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-stone-800'
    ]"
    :title="cachedIsFavorite ? t('favorites.remove') : t('favorites.add')"
    :aria-label="cachedIsFavorite ? t('favorites.remove') : t('favorites.add')"
    :aria-pressed="cachedIsFavorite"
  >
    <svg
      :class="['transition-all duration-300', buttonClasses.icon, isAnimating ? 'scale-125' : '']"
      :fill="cachedIsFavorite ? 'currentColor' : 'none'"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
    <span v-if="showLabel" class="ml-2 text-sm font-medium">
      {{ cachedIsFavorite ? t('favorites.remove') : t('favorites.add') }}
    </span>
  </button>
</template>
