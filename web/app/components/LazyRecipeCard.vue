<script setup lang="ts">
/**
 * LazyRecipeCard - 懒加载食谱卡片组件
 *
 * Nuxt 4 自动识别 components/ 目录下的 Lazy 前缀组件
 * 使用 <LazyRecipeCard> 时会自动延迟加载
 *
 * 性能优化点：
 * - 组件级懒加载
 * - v-memo 防止不必要的重渲染
 * - NuxtImg 内置图片懒加载
 */

import type { Recipe } from '~/types'
import { calculateTotalTime } from '~/utils/sharedPosterConstants'

interface Props {
  recipe: Pick<Recipe, 'id' | 'title' | 'imageUrl' | 'prepTimeMinutes' | 'cookTimeMinutes' | 'servings' | 'views'>
  /** 入场动画延迟 */
  enterDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  enterDelay: 0,
})

const { t } = useI18n()
const localePath = useLocalePath()

const totalTime = computed(() =>
  calculateTotalTime(props.recipe.prepTimeMinutes, props.recipe.cookTimeMinutes)
)

// 控制入场动画 - 仅在有延迟时创建setTimeout，避免不必要的定时器
const isVisible = ref(props.enterDelay === 0)
onMounted(() => {
  if (props.enterDelay > 0) {
    const timer = setTimeout(() => {
      isVisible.value = true
    }, props.enterDelay)
    // 清理定时器防止组件卸载后触发
    onUnmounted(() => clearTimeout(timer))
  }
})
</script>

<template>
  <NuxtLink
    :to="localePath(`/recipes/${recipe.id}`)"
    class="recipe-card group bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-stone-900/30 transition-all duration-300 hover:-translate-y-1"
    :class="{ 'recipe-card-enter': isVisible }"
    :style="enterDelay > 0 ? { animationDelay: `${enterDelay}ms` } : undefined"
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
        class="transition-transform duration-500 group-hover:scale-110"
        sizes="sm:100vw md:50vw lg:400px"
        quality="80"
      />
      <!-- 无图片时显示默认图标 -->
      <div
        v-else
        class="w-full h-full flex items-center justify-center"
      >
        <span class="text-5xl">🍽️</span>
      </div>

      <!-- Hover时的渐变遮罩 -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <!-- 时间标签 -->
      <div class="absolute top-3 right-3 bg-white/90 dark:bg-stone-900/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-stone-700 dark:text-stone-200 shadow-sm">
        ⏱️ {{ totalTime }}{{ t('recipe.min') }}
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 dark:text-stone-100 text-base leading-snug line-clamp-2 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
        {{ recipe.title }}
      </h3>

      <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-stone-400">
        <span class="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full">
          ⏱️ {{ totalTime }}{{ t('recipe.min') }}
        </span>
        <span class="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
          👥 {{ recipe.servings }}{{ t('recipe.servings') }}
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

/* 多行文本截断 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
