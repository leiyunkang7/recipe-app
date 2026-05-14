<script setup lang="ts">
/**
 * RecipeDetailHero - 食谱详情页 Hero 图片组件
 *
 * 功能：
 * - 响应式图片展示 (移动端/桌面端)
 * - 图片懒加载/预加载策略
 * - 无图片时显示默认图标
 * - 渐变遮罩效果
 *
 * 优化：合并移动端/桌面端结构，减少重复代码
 *
 * 使用方式：
 * <RecipeDetailHero :recipe="recipe" />
 */
import type { Recipe } from '~/types'
import PlateIcon from '~/components/icons/PlateIcon.vue'

defineProps<{
  recipe: Recipe
}>()

const plateIconSize = 'w-20 h-20'
</script>

<template>
  <!-- Unified Hero: mobile (full-bleed) / desktop (card with inner container) -->
  <div class="lg:hidden relative h-56 sm:h-72 bg-gradient-to-br from-orange-100 dark:from-orange-900 to-orange-200 dark:to-orange-800 overflow-hidden">
    <AppImage
      v-if="recipe.imageUrl"
      :src="recipe.imageUrl"
      :srcset="recipe.imageSrcset"
      :alt="recipe.title"
      class="w-full h-full"
      loading="eager"
      fetchpriority="high"
      sizes="sm:100vw md:100vw lg:800px"
      :quality="85"
    />
    <div v-else class="w-full h-full flex items-center justify-center">
      <PlateIcon :class="[plateIconSize, 'text-orange-300 dark:text-orange-500']" aria-hidden="true" />
    </div>
    <!-- Gradient mask -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
  </div>

  <!-- Desktop: wrapped in card container -->
  <div class="hidden lg:block bg-white dark:bg-stone-800 rounded-xl shadow-md dark:shadow-stone-900/30 overflow-hidden">
    <div class="relative h-96 bg-gradient-to-br from-orange-100 dark:from-orange-900 to-orange-200 dark:to-orange-800">
      <AppImage
        v-if="recipe.imageUrl"
        :src="recipe.imageUrl"
        :srcset="recipe.imageSrcset"
        :alt="recipe.title"
        class="w-full h-full"
        loading="eager"
        fetchpriority="high"
        sizes="lg:800px xl:1024px"
        :quality="85"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <PlateIcon :class="[plateIconSize, 'text-orange-300 dark:text-orange-500']" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>