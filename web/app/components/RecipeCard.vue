<script setup lang="ts">
/**
 * RecipeCard - 食谱卡片组件
 * 
 * 响应式设计：
 * - 移动端：紧凑布局，小字体
 * - 平板：标准布局
 * - 桌面：hover效果更显著
 * 
 * 优化点：
 * - 骨架屏loading状态
 * - 图片懒加载
 * - 触摸反馈优化
 * - 暗色模式支持
 * - 入场动画
 */

import type { Recipe } from '~/types'

// Card-specific props - uses subset of Recipe fields
interface Props {
  recipe: Pick<Recipe, 'id' | 'title' | 'imageUrl' | 'prepTimeMinutes' | 'cookTimeMinutes' | 'servings' | 'views'>
  loading?: boolean
  lazy?: boolean
  enterDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  lazy: true,
  enterDelay: 0,
})

const { t } = useI18n()

const totalTime = computed(() => 
  props.recipe.prepTimeMinutes + props.recipe.cookTimeMinutes
)

const localePath = useLocalePath()

// 控制入场动画
const isVisible = ref(false)
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, props.enterDelay)
})
</script>

<template>
  <!-- 骨架屏状态 -->
  <div
    v-if="loading"
    class="bg-white dark:bg-stone-800 rounded-xl overflow-hidden shadow-sm animate-pulse"
  >
    <div class="aspect-square bg-gray-200 dark:bg-stone-700"></div>
    <div class="p-3 space-y-2">
      <div class="h-4 bg-gray-200 dark:bg-stone-700 rounded w-3/4"></div>
      <div class="h-3 bg-gray-200 dark:bg-stone-700 rounded w-1/2"></div>
    </div>
  </div>

  <!-- 正常状态 -->
  <NuxtLink
    v-else
    :to="localePath(`/recipes/${recipe.id}`)"
    class="recipe-card-enter group bg-white dark:bg-stone-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg dark:shadow-stone-900/30 transition-all duration-300 active:scale-[0.98] touch-manipulation"
    :style="{ animationDelay: `${enterDelay}ms` }"
  >
    <!-- 图片区域 -->
    <div 
      class="relative aspect-square overflow-hidden"
      :style="{ background: `linear-gradient(135deg, var(--color-card-gradient-start), var(--color-card-gradient-end))` }"
    >
      <NuxtImg
        v-if="recipe.imageUrl"
        :src="recipe.imageUrl"
        :alt="recipe.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        :loading="lazy ? 'lazy' : 'eager'"
        decoding="async"
        format="webp"
        sizes="sm:100vw md:50vw lg:400px"
        quality="80"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <span class="text-4xl">🍽️</span>
      </div>
      
      <!-- Hover时的渐变遮罩 -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <!-- 时间标签 -->
      <div class="absolute top-2 right-2 bg-white/90 dark:bg-stone-900/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-stone-700 dark:text-stone-200 shadow-sm">
        ⏱️ {{ totalTime }}{{ t('recipe.min') }}
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="p-2.5 sm:p-3">
      <h3 class="font-semibold text-gray-900 dark:text-stone-100 text-sm sm:text-base leading-snug line-clamp-2 mb-1.5 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
        {{ recipe.title }}
      </h3>

      <div class="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-stone-400">
        <span class="flex items-center gap-0.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {{ totalTime }}{{ t('recipe.min') }}
        </span>
        <span class="text-gray-300 dark:text-stone-600">·</span>
        <span>{{ recipe.servings }}{{ t('recipe.servings') }}</span>
        <template v-if="recipe.views">
          <span class="text-gray-300 dark:text-stone-600">·</span>
          <span class="flex items-center gap-0.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            {{ recipe.views }}
          </span>
        </template>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 触摸设备优化 */
@media (hover: none) {
  .touch-manipulation {
    touch-action: manipulation;
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
