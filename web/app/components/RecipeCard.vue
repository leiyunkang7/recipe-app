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
 */

interface Props {
  recipe: {
    id: number
    title: string
    imageUrl?: string
    prepTimeMinutes: number
    cookTimeMinutes: number
    servings: number
  }
  /** 是否处于loading状态（骨架屏） */
  loading?: boolean
  /** 图片懒加载 */
  lazy?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  lazy: true,
})

const { t } = useI18n()

const totalTime = computed(() => 
  props.recipe.prepTimeMinutes + props.recipe.cookTimeMinutes
)

const localePath = useLocalePath()
</script>

<template>
  <!-- 骨架屏状态 -->
  <div
    v-if="loading"
    class="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse"
  >
    <div class="aspect-square bg-gray-200"></div>
    <div class="p-3 space-y-2">
      <div class="h-4 bg-gray-200 rounded w-3/4"></div>
      <div class="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>

  <!-- 正常状态 -->
  <NuxtLink
    v-else
    :to="localePath(`/recipes/${recipe.id}`)"
    class="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] touch-manipulation"
  >
    <!-- 图片区域 -->
    <div class="relative bg-gradient-to-br from-orange-100 to-orange-200 aspect-square overflow-hidden">
      <img
        v-if="recipe.imageUrl"
        :src="recipe.imageUrl"
        :alt="recipe.title"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        :loading="lazy ? 'lazy' : 'eager'"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <span class="text-4xl">🍽️</span>
      </div>
      
      <!-- Hover时的渐变遮罩 -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
    </div>

    <!-- 内容区域 -->
    <div class="p-2.5 sm:p-3">
      <h3 class="font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 mb-1.5 group-hover:text-orange-600 transition-colors">
        {{ recipe.title }}
      </h3>

      <div class="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
        <span class="flex items-center gap-0.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {{ totalTime }}{{ t('recipe.min') }}
        </span>
        <span class="text-gray-300">·</span>
        <span>{{ recipe.servings }}{{ t('recipe.servings') }}</span>
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
  .group-hover\:scale-105 {
    transform: none;
  }
}
</style>
