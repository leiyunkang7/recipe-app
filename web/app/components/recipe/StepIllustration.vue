<script setup lang="ts">
/**
 * StepIllustration - Step-by-step cooking illustration component
 * Shows SVG illustration with step context indicator
 */
interface Props {
  stepNumber: number
  totalSteps: number
  hasImage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  hasImage: false,
  size: 'md',
})

// Cooking-themed SVG illustration patterns based on step position
const illustrationPatterns = [
  // Step 1: Chopping/prep
  { bg: 'from-emerald-400 to-teal-500', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
  // Step 2: Mixing/stirring
  { bg: 'from-blue-400 to-indigo-500', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  // Step 3: Heating/cooking
  { bg: 'from-orange-400 to-red-500', icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
  // Step 4: Tasting/checking
  { bg: 'from-yellow-400 to-amber-500', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  // Step 5: Plating/serving
  { bg: 'from-purple-400 to-pink-500', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  // Step 6: Enjoying
  { bg: 'from-green-400 to-emerald-500', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

const getPattern = (stepNum: number) => {
  const index = (stepNum - 1) % illustrationPatterns.length
  return illustrationPatterns[index]
}

const pattern = computed(() => getPattern(props.stepNumber))

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-14 h-14'
    case 'lg': return 'w-32 h-32'
    default: return 'w-20 h-20'
  }
})

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-6 h-6'
    case 'lg': return 'w-14 h-14'
    default: return 'w-9 h-9'
  }
})
</script>

<template>
  <div
    class="step-illustration rounded-xl bg-gradient-to-br flex items-center justify-center overflow-hidden"
    :class="[sizeClasses, pattern.bg]"
  >
    <!-- Has image indicator -->
    <template v-if="hasImage">
      <svg class="w-3/5 h-3/5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </template>
    
    <!-- Step illustration icon -->
    <template v-else>
      <svg
        class="text-white drop-shadow-sm"
        :class="iconSize"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="1.5"
      >
        <path stroke-linecap="round" stroke-linejoin="round" :d="pattern.icon" />
      </svg>
    </template>

    <!-- Step number badge -->
    <div class="absolute bottom-0.5 right-0.5 w-5 h-5 bg-white/90 dark:bg-stone-800/90 rounded-full flex items-center justify-center shadow-sm">
      <span class="text-xs font-bold" :class="hasImage ? 'text-stone-600 dark:text-stone-300' : 'text-stone-600 dark:text-stone-300'">{{ stepNumber }}</span>
    </div>
  </div>
</template>

<style scoped>
.step-illustration {
  position: relative;
  contain: layout style;
}

@media (prefers-reduced-motion: reduce) {
  .step-illustration,
  .step-illustration * {
    transition: none !important;
  }
}
</style>
