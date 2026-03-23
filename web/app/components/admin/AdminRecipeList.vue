<script setup lang="ts">
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
