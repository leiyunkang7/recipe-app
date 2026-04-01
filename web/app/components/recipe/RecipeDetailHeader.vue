<script setup lang="ts">
/**
 * RecipeDetailHeader - 食谱详情页头部组件
 *
 * 功能：
 * - 移动端/桌面端响应式布局
 * - 返回按钮
 * - 收藏按钮
 * - 分享按钮 (桌面端)
 * - 语言切换器
 * - 粘性定位
 *
 * 优化说明：
 * - 桌面端使用内联分享按钮代替 LazyRecipeShareMenu 组件
 *   原因：LazyRecipeShareMenu 在移动端也会实例化（CSS 仅控制显示/隐藏）
 *   分享功能只需在桌面端使用，内联按钮更轻量且避免不必要的组件实例化
 * - 移动端分享/收藏操作由页面底部操作栏提供
 *
 * 使用方式：
 * <RecipeDetailHeader
 *   :is-favorite="true"
 *   :recipe="recipe"
 *   @toggle-favorite="toggle"
 *   @share="share"
 * />
 */
import type { Recipe } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()

const props = withDefaults(defineProps<{
  isFavorite: boolean
  recipe?: Recipe | null
}>(), {
  recipe: null,
})

const emit = defineEmits<{
  toggleFavorite: []
  share: []
}>()

// 统一的操作按钮样式 - 桌面端复用
const actionButtonClass = computed(() =>
  'inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors text-sm font-medium'
)
</script>

<template>
  <!-- Mobile Header -->
  <header class="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-stone-800/95 backdrop-blur-md shadow-sm">
    <div class="flex items-center justify-between px-4 py-3">
      <NuxtLink
        :to="localePath('/')"
        class="min-w-[44px] min-h-[44px] inline-flex items-center justify-center gap-1.5 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors text-sm font-medium active:scale-95 touch-manipulation"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        {{ t('common.back') }}
      </NuxtLink>

      <div class="flex items-center gap-2">
        <button
          @click="emit('toggleFavorite')"
          class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors active:scale-95 touch-manipulation"
          :aria-label="isFavorite ? t('favorites.remove') : t('favorites.add')"
        >
          <HeartIcon class="w-6 h-6 transition-transform" :class="isFavorite ? 'scale-110 text-red-500' : 'text-gray-400'" :filled="isFavorite" />
        </button>
        <LanguageSwitcher />
      </div>
    </div>
  </header>

  <!-- Desktop Header -->
  <!-- 优化：使用内联按钮代替 LazyRecipeShareMenu 组件，避免移动端也实例化该组件 -->
  <header class="hidden lg:block bg-white dark:bg-stone-800 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <NuxtLink
          :to="localePath('/')"
          class="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
        >
          ← {{ t('common.back') }}
        </NuxtLink>
        <div class="flex items-center gap-3">
          <!-- 分享按钮 - 内联实现，替代 LazyRecipeShareMenu -->
          <!-- 原因：LazyRecipeShareMenu 在移动端也会实例化，使用内联按钮更轻量 -->
          <button
            v-if="recipe"
            @click="emit('share')"
            :class="actionButtonClass"
            :title="t('recipe.sharePoster')"
          >
            <ShareIcon class="w-4 h-4" />
            <span>{{ t('recipe.share') }}</span>
          </button>
          <button
            @click="emit('toggleFavorite')"
            :class="actionButtonClass"
          >
            <HeartIcon class="w-4 h-4" :filled="isFavorite" />
            <span>{{ isFavorite ? t('favorites.remove') : t('favorites.add') }}</span>
          </button>
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  </header>
</template>
