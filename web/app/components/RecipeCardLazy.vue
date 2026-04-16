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
 */

import type { RecipeListItem } from '~/types'
import { calculateTotalTime } from '~/utils/sharedPosterConstants'
import { highlightSearchTerms } from '~/utils/searchHighlight'
import TimerIcon from '~/components/icons/TimerIcon.vue'
import PeopleIcon from '~/components/icons/PeopleIcon.vue'
import EyeIcon from '~/components/icons/EyeIcon.vue'
import PlateIcon from '~/components/icons/PlateIcon.vue'
import StarIcon from '~/components/icons/StarIcon.vue'
import FireIcon from '~/components/icons/FireIcon.vue'
import HeartIcon from '~/components/icons/HeartIcon.vue'
import { useLongPressGesture } from '~/composables/useLongPressGesture'
import { useDoubleTapGesture } from '~/composables/useDoubleTapGesture'
import { useClickOutside } from '~/composables/useClickOutside'

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

// Consolidated display info into a single computed to reduce reactivity overhead
// Previously: 4 separate computed (totalTime, ratingDisplay, nutritionDisplay, cardClasses/imageClasses)
const displayInfo = computed(() => {
  const recipe = props.recipe
  const totalTime = calculateTotalTime(recipe.prepTimeMinutes, recipe.cookTimeMinutes)
  const avg = recipe.averageRating ?? 0
  const count = recipe.ratingCount ?? 0
  const cal = recipe.nutritionInfo?.calories ?? 0

  return {
    totalTime,
    totalTimeFormatted: `${totalTime}${t('recipe.min')}`,
    rating: {
      has: avg > 0 && count > 0,
      value: Math.round(avg),
      count,
    },
    nutrition: {
      has: cal > 0,
      calories: Math.round(cal),
    },
  }
})

// Combined class computation for card and image
const cardAndImageClasses = computed(() => {
  const disabled = props.disableAnimation
  return {
    card: disabled
      ? 'recipe-card group bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm recipe-card-material'
      : 'recipe-card group bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm recipe-card-material hover:shadow-xl dark:shadow-stone-900/30 transition-all duration-300 hover:-translate-y-1',
    image: disabled ? 'w-full h-full' : 'w-full h-full transition-transform duration-500 group-hover:scale-110',
  }
})

// Search highlighting - computed only when searchQuery is present
const highlightedTitle = computed(() => {
  if (!props.searchQuery) return props.recipe.title
  return highlightSearchTerms(props.recipe.title, props.searchQuery)
})

const highlightedDescription = computed(() => {
  if (!props.searchQuery || !props.recipe.description) return props.recipe.description
  return highlightSearchTerms(props.recipe.description, props.searchQuery)
})

// 控制入场动画 - 仅在有延迟时创建setTimeout，避免不必要的定时器
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

useLongPressGesture(
  cardRef as Ref<HTMLElement | null>,
  {
    onLongPressStart: (state, e) => {
      if (!isComponentMounted) return
      showContextMenu.value = true
      // Position menu at touch point or center of card
      contextMenuPos.x = state.startX
      contextMenuPos.y = state.startY
    },
    onLongPressEnd: () => {
      // Menu stays open until clicked outside
    },
    onLongPressCancel: () => {
      if (!isComponentMounted) return
      showContextMenu.value = false
    }
  }
)

// Close context menu when clicking outside
const { toggleFavorite } = useFavorites()

useDoubleTapGesture(
  cardRef as Ref<HTMLElement | null>,
  {
    onDoubleTap: (state, e) => {
      if (!isComponentMounted) return
      // Double tap on card to favorite
      if (!showContextMenu.value) {
        toggleFavorite(props.recipe.id)
        // Show quick feedback
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

// Context menu position - memoized computed to avoid repeated window checks
const contextMenuStyle = computed(() => {
  const maxX = typeof window !== 'undefined' ? window.innerWidth - 180 : contextMenuPos.x
  const maxY = typeof window !== 'undefined' ? window.innerHeight - 200 : contextMenuPos.y
  return {
    left: `${Math.min(contextMenuPos.x, maxX)}px`,
    top: `${Math.min(contextMenuPos.y, maxY)}px`,
    transform: 'translate(-50%, -100%)'
  } as const
})

onMounted(() => {
  isComponentMounted = true
  // 虚拟滚动模式下不执行动画
  if (props.disableAnimation) return

  if (props.enterDelay > 0) {
    enterTimer = setTimeout(() => {
      if (isComponentMounted) {
        isVisible.value = true
      }
    }, props.enterDelay)
  }
})

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
      :class="[cardAndImageClasses.card, { 'recipe-card-enter': isVisible }]"
      :style="props.enterDelay > 0 ? { animationDelay: `${enterDelay}ms` } : undefined"
      role="article"
      :aria-label="`${recipe.title}, ${t('recipe.totalTime')}: ${displayInfo.totalTime}${t('recipe.min')}`"
      v-memo="[recipe.id, recipe.title, recipe.description, recipe.imageUrl, recipe.views, recipe.averageRating, recipe.prepTimeMinutes, recipe.cookTimeMinutes, props.searchQuery]"
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
        :class="cardAndImageClasses.image"
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
        {{ displayInfo.totalTimeFormatted }}
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

      <div class="flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs text-gray-500 dark:text-stone-400">
        <span class="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs">
          <TimerIcon aria-hidden="true" class="w-3 h-3" />{{ displayInfo.totalTimeFormatted }}
        </span>
        <span class="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs">
          <PeopleIcon aria-hidden="true" class="w-3 h-3" />{{ recipe.servings }}{{ t('recipe.servings') }}
        </span>
        <span v-if="recipe.views" class="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs">
          <EyeIcon aria-hidden="true" class="w-3 h-3" />{{ recipe.views }}
        </span>
        <span v-if="displayInfo.rating.has" class="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs">
          <StarIcon aria-hidden="true" class="w-3 h-3 text-amber-400" />{{ displayInfo.rating.value }}<span class="text-gray-500 dark:text-stone-400 text-[10px]">({{ displayInfo.rating.count }})</span>
        </span>
        <span v-if="displayInfo.nutrition.has" class="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs text-red-600 dark:text-red-400">
          <FireIcon aria-hidden="true" class="w-3 h-3" />{{ displayInfo.nutrition.calories }}
        </span>
      </div>
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
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span class="text-sm font-medium">{{ t('recipe.viewRecipe') || 'View Recipe' }}</span>
        </NuxtLink>

        <div class="h-px bg-stone-200 dark:bg-stone-700 mx-2 my-1"></div>

        <button
          class="w-full flex items-center gap-3 px-4 py-3 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          @click.stop="showContextMenu = false"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
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
