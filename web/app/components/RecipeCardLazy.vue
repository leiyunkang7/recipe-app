<script setup lang="ts">
/**
 * RecipeCardLazy - 懒加载食谱卡片组件
 *
 * Nuxt 4 自动识别 components/ 目录下的 Lazy 前缀组件
 * 使用 <RecipeCardLazy> 时会自动延迟加载
 *
 * 性能优化点：
 * - 组件级懒加载
 * - v-memo 防止不必要的重渲染
 * - NuxtImg 内置图片懒加载
 * - 虚拟滚动模式下跳过 gesture composable 初始化
 * - 静态 class 字符串避免 computed 响应式开销
 */

import type { RecipeListItem } from '~/types'
import { highlightSearchTerms } from '~/utils/searchHighlight'
import PlateIcon from '~/components/icons/PlateIcon.vue'
import TimerIcon from '~/components/icons/TimerIcon.vue'
import HeartIcon from '~/components/icons/HeartIcon.vue'
import EyeIcon from '~/components/icons/EyeIcon.vue'
import ShareIcon from '~/components/icons/ShareIcon.vue'

interface Props {
  recipe: RecipeListItem
  /** 入场动画延迟 */
  enterDelay?: number
  /** 禁用入场动画（虚拟滚动模式下设置为true） */
  disableAnimation?: boolean
  /** 搜索关键词，用于高亮显示 */
  searchQuery?: string
}

const props = withDefaults(defineProps<Props>(), {
  enterDelay: 0,
  disableAnimation: false,
  searchQuery: '',
})

const { t } = useI18n()
const localePath = useLocalePath()

// Card classes - static per instance, disableAnimation never changes at runtime
// Using plain constants avoids Vue computed reactivity tracking overhead
const cardClasses = props.disableAnimation
  ? 'recipe-card group bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm recipe-card-material'
  : 'recipe-card group bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm recipe-card-material hover:shadow-xl dark:shadow-stone-900/30 transition-all duration-300 hover:-translate-y-1'

// Image classes - static per instance, disableAnimation never changes at runtime
const imageClasses = props.disableAnimation
  ? 'w-full h-full'
  : 'w-full h-full transition-transform duration-500 group-hover:scale-110'

// Pre-compute total time once — used by both aria-label and the image overlay badge.
// Extracting prepTime and cookTime into separate computed refs avoids tracking the
// entire recipe object. Without this, changes to any recipe property (views,
// averageRating, etc.) would trigger the totalTime computed to re-evaluate.
const recipePrepTime = computed(() => props.recipe.prepTimeMinutes)
const recipeCookTime = computed(() => props.recipe.cookTimeMinutes)
const totalTime = computed(() => recipePrepTime.value + recipeCookTime.value)

// Search highlighting — computed only when searchQuery is present
// Extract description into its own computed to avoid tracking the entire
// recipe object as a dependency. Without this, changes to any recipe property
// (views, averageRating, etc.) would trigger the highlight computed to re-run.
const recipeDescription = computed(() => props.recipe.description)
const recipeTitle = computed(() => props.recipe.title)

const highlightedTitle = computed(() => {
  if (!props.searchQuery) return recipeTitle.value
  return highlightSearchTerms(recipeTitle.value, props.searchQuery)
})

const highlightedDescription = computed(() => {
  if (!props.searchQuery || !recipeDescription.value) return recipeDescription.value
  return highlightSearchTerms(recipeDescription.value, props.searchQuery)
})

// 控制入场动画 - 仅在有延迟时创建定时器，避免不必要的定时器
// 虚拟滚动模式下禁用动画以提升性能
const isVisible = ref(props.disableAnimation ? true : props.enterDelay === 0)
let enterTimer: ReturnType<typeof setTimeout> | null = null

// Long press context menu state
const cardRef = ref<HTMLElement | null>(null)
const showContextMenu = ref(false)
const showDoubleTapHint = ref(false)
const doubleTapTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const contextMenuPos = reactive({ x: 0, y: 0 })

// Track mounted state to prevent state updates after unmount in gesture callbacks
let isComponentMounted = false

// Context menu position — memoized computed with early exit.
// The window dimension checks are only meaningful when the menu is visible.
// Short-circuiting avoids repeated window property access on every reactive update.
const contextMenuStyle = computed(() => {
  if (!showContextMenu.value) {
    return { left: '0px', top: '0px', transform: 'translate(-50%, -100%)' } as const
  }
  const maxX = typeof window !== 'undefined' ? window.innerWidth - 180 : contextMenuPos.x
  const maxY = typeof window !== 'undefined' ? window.innerHeight - 200 : contextMenuPos.y
  return {
    left: `${Math.min(contextMenuPos.x, maxX)}px`,
    top: `${Math.min(contextMenuPos.y, maxY)}px`,
    transform: 'translate(-50%, -100%)'
  } as const
})

// ─── Gesture composables — only initialize when NOT in virtual scroll mode ───
// Virtual scroll renders 50+ cards; creating gesture listeners per card adds
// significant overhead (3 composables × 50 cards = 150 reactive contexts).
// In virtual mode gestures are unnecessary since cards are positioned absolutely.
if (!props.disableAnimation) {
  const { toggleFavorite } = useFavorites()

  // Gesture activation guard — prevents callbacks from running until
  // the user has actually interacted with this specific card.
  let gestureEnabled = false

  useLongPressGesture(
    cardRef as Ref<HTMLElement | null>,
    {
      onLongPressStart: (state) => {
        if (!isComponentMounted || !gestureEnabled) return
        showContextMenu.value = true
        contextMenuPos.x = state.startX
        contextMenuPos.y = state.startY
      },
      onLongPressEnd: () => {
        // Menu stays open until clicked outside
      },
      onLongPressCancel: () => {
        if (!isComponentMounted || !gestureEnabled) return
        showContextMenu.value = false
      }
    }
  )

  useDoubleTapGesture(
    cardRef as Ref<HTMLElement | null>,
    {
      onDoubleTap: () => {
        if (!isComponentMounted || !gestureEnabled) return
        if (!showContextMenu.value) {
          toggleFavorite(props.recipe.id)
          showDoubleTapHint.value = true
          if (doubleTapTimer.value) clearTimeout(doubleTapTimer.value)
          doubleTapTimer.value = setTimeout(() => {
            if (!isComponentMounted) return
            showDoubleTapHint.value = false
          }, 800)
        }
      }
    }
  )

  useClickOutside(cardRef as Ref<HTMLElement | null>, () => {
    if (!isComponentMounted) return
    showContextMenu.value = false
    showDoubleTapHint.value = false
  })

  onMounted(() => {
    isComponentMounted = true

    if (props.enterDelay > 0) {
      enterTimer = setTimeout(() => {
        if (isComponentMounted) {
          isVisible.value = true
        }
      }, props.enterDelay)
    }

    // Enable gesture handlers on first pointer interaction
    const enableGestures = () => {
      gestureEnabled = true
      cardRef.value?.removeEventListener('pointerdown', enableGestures)
    }
    cardRef.value?.addEventListener('pointerdown', enableGestures, { passive: true })
  })
} else {
  // Virtual scroll mode: no gestures, no animations — just minimal setup
  onMounted(() => {
    isComponentMounted = true
  })
}

onUnmounted(() => {
  isComponentMounted = false
  // 清理定时器防止组件卸载后触发
  if (enterTimer) {
    clearTimeout(enterTimer)
    enterTimer = null
  }
  if (doubleTapTimer.value) {
    clearTimeout(doubleTapTimer.value)
    doubleTapTimer.value = null
  }
})
</script>

<template>
  <div ref="cardRef" class="relative">
    <NuxtLink
      :to="localePath(`/recipes/${recipe.id}`)"
      :class="[cardClasses, { 'recipe-card-enter': isVisible }]"
      :style="props.enterDelay > 0 ? { animationDelay: `${enterDelay}ms` } : undefined"
      role="article"
      :aria-label="`${recipe.title}, ${t('recipe.totalTime')}: ${totalTime}${t('recipe.min')}`"
      v-memo="[recipe.id, recipe.title, recipe.description, recipe.imageUrl, recipe.averageRating, totalTime, props.searchQuery]"
      @click.stop
    >
    <!-- 图片区域 -->
    <div
      class="relative aspect-[4/3] overflow-hidden"
      :style="{ background: `linear-gradient(135deg, var(--color-card-gradient-start), var(--color-card-gradient-end))` }"
    >
      <!-- AppImage: NuxtImg + shimmer占位符 -->
      <AppImage
        v-if="recipe.imageUrl"
        :src="recipe.imageUrl"
        :srcset="recipe.imageSrcset"
        :alt="recipe.title"
        :class="imageClasses"
        sizes="sm:100vw md:50vw lg:400px"
        :quality="80"
      />
      <!-- 无图片时显示默认图标 -->
      <div
        v-else
        class="w-full h-full flex items-center justify-center"
      >
        <PlateIcon class="w-12 h-12 text-orange-300 dark:text-orange-600" />
      </div>

      <!-- Hover时的渐变遮罩 -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <!-- 时间标签 -->
      <div class="absolute top-3 right-3 bg-white/90 dark:bg-stone-900/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-stone-700 dark:text-stone-200 shadow-sm flex items-center gap-1">
        <TimerIcon aria-hidden="true" class="w-3 h-3" />
        {{ totalTime }}{{ t('recipe.min') }}
      </div>

      <!-- 收藏按钮 -->
      <div class="absolute top-3 left-3">
        <FavoriteButton :recipe-id="recipe.id" size="sm" />
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="p-3 sm:p-4">
      <h3
        class="font-semibold text-gray-900 dark:text-stone-100 text-base leading-snug line-clamp-2 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors"
        v-html="highlightedTitle"
      />

      <p
        v-if="highlightedDescription"
        class="text-sm text-gray-600 dark:text-stone-400 line-clamp-2 mb-2"
        v-html="highlightedDescription"
      />

      <RecipeCardBadges
        :prep-time-minutes="recipe.prepTimeMinutes"
        :cook-time-minutes="recipe.cookTimeMinutes"
        :servings="recipe.servings"
        :views="recipe.views"
        :average-rating="recipe.averageRating"
        :rating-count="recipe.ratingCount"
        :calories="recipe.nutritionInfo?.calories"
        v-memo="[recipe.prepTimeMinutes, recipe.cookTimeMinutes, recipe.servings, recipe.views, recipe.averageRating, recipe.ratingCount, recipe.nutritionInfo?.calories]"
      />
    </div>
    </NuxtLink>

    <!-- Double tap favorite hint -->
    <Transition name="double-tap-hint">
      <div
        v-if="showDoubleTapHint"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
      >
        <HeartIcon class="w-5 h-5" />
        <span class="text-sm font-medium">{{ t('favorites.add') }}</span>
      </div>
    </Transition>

    <!-- Long press context menu -->
    <Transition name="context-menu">
      <div
        v-if="showContextMenu"
        class="absolute z-50 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 py-2 min-w-[160px] overflow-hidden"
        :style="contextMenuStyle"
        @click.stop
      >
        <NuxtLink
          :to="localePath(`/recipes/${recipe.id}`)"
          class="flex items-center gap-3 px-4 py-3 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          @click="showContextMenu = false"
        >
          <EyeIcon class="w-5 h-5" />
          <span class="text-sm font-medium">{{ t('recipe.viewRecipe') || 'View Recipe' }}</span>
        </NuxtLink>

        <div class="h-px bg-stone-200 dark:bg-stone-700 mx-2 my-1"></div>

        <button
          class="w-full flex items-center gap-3 px-4 py-3 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          @click.stop="showContextMenu = false"
        >
          <ShareIcon class="w-5 h-5" />
          <span class="text-sm font-medium">{{ t('recipe.share') || 'Share' }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Context menu animation */
.context-menu-enter-active,
.context-menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.context-menu-enter-from,
.context-menu-leave-to {
  opacity: 0;
  transform: translate(-50%, -90%);
}

/* Double tap hint animation */
.double-tap-hint-enter-active,
.double-tap-hint-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.double-tap-hint-enter-from,
.double-tap-hint-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}

/* 入场动画 */
.recipe-card-enter {
  animation: cardFadeIn 0.4s ease-out forwards;
  opacity: 0;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .group-hover\:scale-110 {
    transform: none;
  }

  .recipe-card-enter {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
