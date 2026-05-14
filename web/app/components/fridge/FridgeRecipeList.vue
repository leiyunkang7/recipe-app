<script setup lang="ts">
/**
 * FridgeRecipeList - 推荐食谱列表子组件
 * 
 * 功能：
 * - 显示匹配的食谱列表
 * - 加载状态
 * - 空状态
 */
import type { Recipe } from '~/types'

interface Props {
  recipes: Recipe[]
  loading: boolean
}

const props = defineProps<Props>()

const { t } = useI18n()
</script>

<template>
  <div>
    <!-- 加载状态 -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500 dark:text-stone-400">{{ t('fridgeMode.finding') }}</p>
    </div>

    <!-- 食谱列表 -->
    <div v-else>
      <p class="text-sm text-gray-500 dark:text-stone-400 mb-4">
        {{ t('fridgeMode.matchedCount', { count: recipes.length }) }}
      </p>
      <div class="space-y-3">
        <button
          v-for="recipe in recipes.slice(0, 10)"
          :key="recipe.id"
          class="w-full p-4 rounded-xl bg-gray-50 dark:bg-stone-700 hover:bg-gray-100 dark:hover:bg-stone-600 transition-colors text-left"
          @click="navigateTo(`/recipes/${recipe.id}`)"
        >
          <h3 class="font-medium text-gray-900 dark:text-white">{{ recipe.title }}</h3>
          <p class="text-sm text-gray-500 dark:text-stone-400 mt-1">
            {{ recipe.ingredients.length }} {{ t('fridgeMode.ingredients') }}
          </p>
        </button>
      </div>
      <p v-if="recipes.length > 10" class="text-center text-sm text-gray-400 mt-4">
        {{ t('fridgeMode.moreResults', { count: recipes.length - 10 }) }}
      </p>
    </div>
  </div>
</template>
