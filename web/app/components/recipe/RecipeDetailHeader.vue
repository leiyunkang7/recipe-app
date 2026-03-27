<script setup lang="ts">
/**
 * RecipeDetailHeader - 食谱详情页头部组件
 *
 * 功能：
 * - 移动端/桌面端响应式布局
 * - 返回按钮
 * - 收藏按钮
 * - 分享菜单
 * - 语言切换器
 * - 粘性定位
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
        <LazyRecipeShareMenu v-if="recipe" :recipe="recipe" />
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
          <LazyRecipeShareMenu v-if="recipe" :recipe="recipe" />
          <button
            @click="emit('toggleFavorite')"
            class="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors text-sm font-medium"
            :title="t('recipe.sharePoster')"
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
