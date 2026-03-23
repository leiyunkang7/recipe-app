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
</script>

<template>
  <div class="overflow-x-auto -mx-4 md:mx-0">
    <AdminRecipeTable
      :recipes="recipes"
      :selected-recipes="selectedRecipes"
      @toggle-select="emit('toggleSelect', $event)"
      @delete="emit('delete', $event)"
    />

    <AdminRecipeMobileList
      :recipes="recipes"
      :selected-recipes="selectedRecipes"
      @toggle-select="emit('toggleSelect', $event)"
      @delete="emit('delete', $event)"
    />
  </div>
</template>
