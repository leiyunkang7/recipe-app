<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipe: Recipe
  currentStep: number
  isMobile?: boolean
  expandedSteps: Set<number>
}>()

const emit = defineEmits<{
  'update:currentStep': [index: number]
  toggleExpand: [index: number]
}>()

const { t } = useI18n()

// Compute isCurrent directly to avoid creating stepStates array with new objects on every step change
// This allows v-memo to work correctly since we use primitive comparisons
</script>

<template>
  <!-- Mobile Steps -->
  <div v-if="isMobile" class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm p-4">
    <h2 class="text-lg font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
      📝 {{ t('recipe.instructions') }}
    </h2>
    <ol class="space-y-3">
      <li
        v-for="(step, index) in props.recipe.steps"
        :key="index"
        v-memo="[props.currentStep === index, props.expandedSteps.has(index)]"
        class="flex gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer"
        :class="props.currentStep === index ? 'bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-500 dark:border-orange-600 shadow-md' : 'hover:bg-stone-50 dark:hover:bg-stone-700 border-2 border-transparent'"
        @click="emit('update:currentStep', index)"
      >
        <span
          class="flex-shrink-0 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center font-bold text-sm"
          :class="props.currentStep === index ? 'bg-orange-500 text-white' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'"
        >
          {{ index + 1 }}
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-gray-900 dark:text-stone-100 text-sm leading-relaxed" :class="{ 'line-clamp-3': !props.expandedSteps.has(index) && props.currentStep !== index }">
            {{ step.instruction }}
          </p>
          <p v-if="step.durationMinutes" class="text-xs text-gray-500 dark:text-stone-400 mt-1.5 flex items-center gap-1">
            <ClockIcon />
            {{ t('recipe.duration') }}: {{ step.durationMinutes }} {{ t('recipe.min') }}
          </p>
        </div>
      </li>
    </ol>
  </div>

  <!-- Desktop Steps -->
  <div v-else class="bg-white dark:bg-stone-800 rounded-xl shadow-md dark:shadow-stone-900/30 p-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
      📝 {{ t('recipe.instructions') }}
    </h2>
    <ol class="space-y-4">
      <li
        v-for="(step, index) in props.recipe.steps"
        :key="index"
        v-memo="[props.currentStep === index]"
        class="flex gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200"
        :class="props.currentStep === index ? 'bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-500 dark:border-orange-600 shadow-md' : 'hover:bg-stone-50 dark:hover:bg-stone-700'"
        @click="emit('update:currentStep', index)"
      >
        <span
          class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
          :class="props.currentStep === index ? 'bg-orange-500 text-white' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'"
        >
          {{ index + 1 }}
        </span>
        <div class="flex-1">
          <p class="text-gray-900 dark:text-stone-100 leading-relaxed">{{ step.instruction }}</p>
          <p v-if="step.durationMinutes" class="text-sm text-gray-500 dark:text-stone-400 mt-2">
            <ClockIcon class="inline-block" /> {{ t('recipe.duration') }}: {{ step.durationMinutes }} {{ t('recipe.min') }}
          </p>
        </div>
      </li>
    </ol>
  </div>
</template>
