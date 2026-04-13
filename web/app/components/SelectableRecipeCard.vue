<script setup lang="ts">
/**
 * SelectableRecipeCard - Wrapper for RecipeCardLazy with selection capability
 *
 * Used in batch selection mode on the favorites page.
 * Provides checkbox overlay for multi-select functionality.
 */
import type { RecipeListItem } from "~/types"

interface Props {
  recipe: RecipeListItem
  isSelected: boolean
  enterDelay?: number
  disableAnimation?: boolean
  searchQuery?: string
}

const props = withDefaults(defineProps<Props>(), {
  enterDelay: 0,
  disableAnimation: false,
  searchQuery: "",
})

const emit = defineEmits<{
  (e: "toggle-select", recipeId: string): void
}>()

const cardRef = ref<HTMLElement | null>(null)

const handleCheckboxClick = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  emit("toggle-select", props.recipe.id)
}

const checkboxClasses = computed(() => {
  const base = "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200"
  return props.isSelected
    ? base + " bg-orange-500 border-orange-500 text-white"
    : base + " bg-white/90 dark:bg-stone-800/90 border-stone-300 dark:border-stone-600 hover:border-orange-400 dark:hover:border-orange-500"
})
</script>

<template>
  <div ref="cardRef" class="selectable-recipe-card relative">
    <!-- Selection checkbox overlay -->
    <div
      class="absolute top-3 left-3 z-10"
      @click.stop
    >
      <button
        @click="handleCheckboxClick"
        :class="checkboxClasses"
        :aria-label="isSelected ? 'Deselect recipe' : 'Select recipe'"
        :aria-pressed="isSelected"
      >
        <svg
          v-if="isSelected"
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>

    <!-- Recipe card -->
    <div class="">
      <RecipeCardLazy
        :recipe="recipe"
        :enter-delay="enterDelay"
        :disable-animation="disableAnimation"
        :search-query="searchQuery"
      />
    </div>

    <!-- Selection highlight border -->
    <div
      v-if="isSelected"
      class="absolute inset-0 rounded-2xl border-2 border-orange-500 dark:border-orange-400 pointer-events-none transition-all duration-200"
    ></div>
  </div>
</template>

<style scoped>
.selectable-recipe-card {
  cursor: pointer;
}

.selectable-recipe-card:hover .recipe-card {
  transform: translateY(-2px);
}
</style>
