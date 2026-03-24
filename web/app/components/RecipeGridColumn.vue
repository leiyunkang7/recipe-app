<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipes: Recipe[]
  enterDelayBase?: number
}>()

const enterDelayBase = props.enterDelayBase ?? 0
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 md:gap-5">
    <LazyRecipeCard
      v-for="(recipe, index) in recipes"
      v-memo="[recipe.id, recipe.title, recipe.prepTimeMinutes, recipe.cookTimeMinutes, recipe.servings]"
      :key="recipe.id"
      :recipe="recipe"
      :enter-delay="enterDelayBase + index * 50"
    />
  </div>
</template>
