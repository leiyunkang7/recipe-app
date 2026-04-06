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
import TimerIcon from '~/components/icons/TimerIcon.vue'
import PeopleIcon from '~/components/icons/PeopleIcon.vue'
import EyeIcon from '~/components/icons/EyeIcon.vue'
import PlateIcon from '~/components/icons/PlateIcon.vue'
import StarIcon from '~/components/icons/StarIcon.vue'

interface Props {
  recipe: RecipeListItem
  /** 入场动画延迟 */
  enterDelay?: number
  /** 禁用入场动画（虚拟滚动模式下设置为true） */
  disableAnimation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enterDelay: 0,
  disableAnimation: false,
})

const { t } = useI18n()
const localePath = useLocalePath()

// 使用 computed 缓存 totalTime 计算结果，避免重复计算
const totalTime = computed(() =>
  calculateTotalTime(props.recipe.prepTimeMinutes, props.recipe.cookTimeMinutes)
)

// Rating display
const hasRating = computed(() => 
  props.recipe.averageRating && props.recipe.averageRating > 0 && props.recipe.ratingCount && props.recipe.ratingCount > 0
)
const displayRating = computed(() => Math.round(props.recipe.averageRating ?? 0))
const ratingCount = computed(() => props.recipe.ratingCount ?? 0)

// 虚拟滚动模式下禁用所有 CSS 过渡以提升滚动性能
// 原因：transition 会导致重排和重绘，在快速滚动时严重影响性能
const cardClasses = computed(() => {
  if (props.disableAnimation) {
    // 虚拟滚动模式：移除所有过渡效果
    return 'recipe-card group bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm'
  }
  return 'recipe-card group bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-stone-900/30 transition-all duration-300 hover:-translate-y-1'
})

const imageClasses = computed(() => {
  if (props.disableAnimation) {
    return 'w-full h-full'
  }
  return 'w-full h-full transition-transform duration-500 group-hover:scale-110'
})

// 控制入场动画 - 仅在有延迟时创建setTimeout，避免不必要的定时器
// 虚拟滚动模式下禁用动画以提升性能
const isVisible = ref(props.disableAnimation ? true : props.enterDelay === 0)
const hasEnterDelay = props.enterDelay > 0
let enterTimer: ReturnType<typeof setTimeout> | null = null
let isMounted = false

onMounted(() => {
  isMounted = true
  // 虚拟滚动模式下不执行动画
  if (props.disableAnimation) return

  if (props.enterDelay > 0) {
    enterTimer = setTimeout(() => {
      // 仅在组件仍挂载时更新状态，防止内存泄漏
      if (isMounted) {
        isVisible.value = true
      }
    }, props.enterDelay)
  }
})

onUnmounted(() => {
  isMounted = false
  // 清理定时器防止组件卸载后触发
  if (enterTimer) {
    clearTimeout(enterTimer)
    enterTimer = null
  }
})
</script>

<template>
  <NuxtLink
    :to="localePath(`/recipes/${recipe.id}`)"
    :class="[cardClasses, { 'recipe-card-enter': isVisible }]"
    :style="hasEnterDelay ? { animationDelay: `${enterDelay}ms` } : undefined"
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
      <h3 class="font-semibold text-gray-900 dark:text-stone-100 text-base leading-snug line-clamp-2 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
        {{ recipe.title }}
      </h3>

      <div class="flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs text-gray-500 dark:text-stone-400">
        <span class="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs">
          <TimerIcon aria-hidden="true" class="w-3 h-3" />{{ totalTime }}{{ t('recipe.min') }}
        </span>
        <span class="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs">
          <PeopleIcon aria-hidden="true" class="w-3 h-3" />{{ recipe.servings }}{{ t('recipe.servings') }}
        </span>
        <span v-if="recipe.views" class="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs">
          <EyeIcon aria-hidden="true" class="w-3 h-3" />{{ recipe.views }}
        </span>
        <span v-if="hasRating" class="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-1 rounded-full min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation justify-center text-xs sm:text-xs">
          <StarIcon aria-hidden="true" class="w-3 h-3 text-amber-400" />{{ displayRating }}<span class="text-gray-400 text-[10px]">({{ ratingCount }})</span>
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
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
