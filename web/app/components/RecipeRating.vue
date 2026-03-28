<script setup lang="ts">
/**
 * RecipeRating - Recipe rating component
 * 
 * Features:
 * - Display 1-5 star rating
 * - Show average rating and count
 * - Interactive star selection for rating
 * - Loading and submitting states
 */
import type { SizeVariant } from '~/types/component-props'

interface Props {
  recipeId: string
  size?: SizeVariant
  showCount?: boolean
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showCount: true,
  interactive: true,
})

const {
  averageRating,
  ratingCount,
  userRating,
  loading,
  submitting,
  init,
  submitRating,
} = useRecipeRating(props.recipeId)

const hoveredStar = ref<number>(0)

// Star sizes based on component size
const starSizes: Record<SizeVariant, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

// Text sizes based on component size
const textSizes: Record<SizeVariant, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

// Handle star hover
const handleMouseEnter = (star: number) => {
  if (props.interactive && !submitting.value) {
    hoveredStar.value = star
  }
}

const handleMouseLeave = () => {
  hoveredStar.value = 0
}

// Handle star click
const handleClick = async (star: number) => {
  if (!props.interactive || submitting.value) return
  await submitRating(star)
}

// Calculate displayed rating (hover takes precedence)
const displayRating = computed(() => {
  if (hoveredStar.value > 0) return hoveredStar.value
  if (userRating.value > 0) return userRating.value
  return Math.round(averageRating.value)
})

// Initialize on mount
onMounted(() => {
  init()
})
</script>

<template>
  <div class="recipe-rating flex items-center gap-2">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center gap-1">
      <div class="animate-pulse flex gap-0.5">
        <div v-for="i in 5" :key="i" class="w-4 h-4 bg-gray-200 dark:bg-stone-700 rounded" />
      </div>
    </div>
    
    <!-- Star rating -->
    <div
      v-else
      class="stars flex items-center gap-0.5"
      @mouseleave="handleMouseLeave"
    >
      <button
        v-for="i in 5"
        :key="i"
        type="button"
        :disabled="!interactive || submitting"
        :class="[
          'star transition-all duration-150',
          interactive && !submitting ? 'cursor-pointer hover:scale-110' : 'cursor-default',
          submitting ? 'opacity-50' : '',
          starSizes[size],
        ]"
        @mouseenter="handleMouseEnter(i)"
        @click="handleClick(i)"
      >
        <!-- Filled star -->
        <svg
          v-if="i <= displayRating"
          class="w-full h-full text-amber-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <!-- Empty star -->
        <svg
          v-else
          class="w-full h-full text-gray-300 dark:text-stone-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 20 20"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </button>
    </div>
    
    <!-- Rating info -->
    <div v-if="showCount" :class="['rating-info flex items-center gap-1', textSizes[size]]">
      <span class="text-gray-700 dark:text-stone-300 font-medium">
        {{ averageRating.toFixed(1) }}
      </span>
      <span class="text-gray-400 dark:text-stone-500">
        ({{ ratingCount }})
      </span>
    </div>
    
    <!-- Submitting indicator -->
    <div v-if="submitting" class="ml-1">
      <svg class="animate-spin w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  </div>
</template>
