<script setup lang="ts">
/**
 * RecipeGridColumn - 食谱网格单列组件
 *
 * 功能：
 * - 接收食谱列表并渲染为卡片列
 * - 入场动画延迟支持
 * - v-memo 优化避免不必要的重渲染
 * - 支持懒加载 (RecipeCardLazy)
 *
 * 使用方式：
 * <RecipeGridColumn :recipes="leftColumnRecipes" :enter-delay-base="100" />
 */
import type { RecipeListItem } from '~/types'

const props = withDefaults(defineProps<{
  recipes: RecipeListItem[]
  enterDelayBase?: number
  searchQuery?: string
}>(), {
  enterDelayBase: 0,
  searchQuery: '',
})
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 md:gap-5" role="presentation">
    <RecipeCardLazy
      v-for="(recipe, index) in recipes"
      :key="recipe.id"
      v-memo="[recipe.id, recipe.title, recipe.description, recipe.imageUrl, recipe.views, recipe.averageRating, recipe.prepTimeMinutes, recipe.cookTimeMinutes, recipe.servings]"
      :recipe="recipe"
      :enter-delay="enterDelayBase + index * 50"
      :search-query="searchQuery"
    />
  </div>
</template>
