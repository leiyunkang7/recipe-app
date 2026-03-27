<script setup lang="ts">
/**
 * AdminRecipeList - 管理后台食谱列表组件
 *
 * 功能：
 * - 响应式展示 (桌面端表格/移动端列表)
 * - 多选支持
 * - 删除操作
 * - 自动切换视图模式
 *
 * 使用方式：
 * <AdminRecipeList
 *   :recipes="recipes"
 *   :selected-recipes="selected"
 *   @toggle-select="handleSelect"
 *   @delete="handleDelete"
 * />
 */
import type { Recipe } from '~/types'

const props = defineProps<{
  recipes: Recipe[]
  selectedRecipes: string[]
}>()

const emit = defineEmits<{
  toggleSelect: [id: string]
  delete: [id: string]
}>()

// Use centralized breakpoint composable
const { isMobile } = useBreakpoint()
</script>

<template>
  <div class="overflow-x-auto -mx-4 md:mx-0 min-w-0">
    <!-- Desktop Table -->
    <AdminRecipeTable
      v-if="!isMobile"
      :recipes="recipes"
      :selected-recipes="selectedRecipes"
      @toggle-select="emit('toggleSelect', $event)"
      @delete="emit('delete', $event)"
    />

    <!-- Mobile List -->
    <AdminRecipeMobileList
      v-else
      :recipes="recipes"
      :selected-recipes="selectedRecipes"
      @toggle-select="emit('toggleSelect', $event)"
      @delete="emit('delete', $event)"
    />
  </div>
</template>
