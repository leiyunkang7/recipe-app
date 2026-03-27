<script setup lang="ts">
/**
 * RecipeGridColumn - 食谱网格单列组件
 *
 * 功能：
 * - 接收食谱列表并渲染为卡片列
 * - 入场动画延迟支持
 * - v-memo 优化避免不必要的重渲染
 * - 支持懒加载 (LazyRecipeCard)
 *
 * 使用方式：
 * <RecipeGridColumn :recipes="leftColumnRecipes" :enter-delay-base="100" />
 */
import type { Recipe } from '~/types'

const props = withDefaults(defineProps<{
  recipes: Recipe[]
  enterDelayBase?: number
}>(), {
  enterDelayBase: 0,
})
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 md:gap-5">
    <LazyRecipeCard
      v-for="(recipe, index) in recipes"
      v-memo="[recipe.id, recipe.title, recipe.imageUrl, recipe.prepTimeMinutes, recipe.cookTimeMinutes, recipe.servings]"
      :key="recipe.id"
      :recipe="recipe"
      :enter-delay="enterDelayBase + index * 50"
    />
  </div>
</template>
