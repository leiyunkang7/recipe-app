<script setup lang="ts">
/**
 * CookingModeStep - 单个烹饪步骤展示组件
 */
import type { RecipeStep } from '~/types'

interface TimerState {
  remaining: number
  isRunning: boolean
  isPaused: boolean
}

interface Props {
  step: RecipeStep
  stepIndex: number
  timer: TimerState | undefined
}

defineProps<Props>()

const emit = defineEmits<{
  'timer-start': []
  'timer-pause': []
  'timer-resume': []
  'timer-stop': []
}>()
</script>

<template>
  <div class="max-w-2xl mx-auto w-full text-center">
    <!-- Step number badge -->
    <div class="mb-6">
      <span class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 text-orange-400 text-2xl font-bold">
        {{ stepIndex + 1 }}
      </span>
    </div>

    <!-- Step instruction - large text for kitchen readability -->
    <p class="text-xl sm:text-2xl md:text-3xl leading-relaxed font-medium text-stone-100 whitespace-pre-wrap">
      {{ step.instruction }}
    </p>

    <!-- Timer -->
    <CookingModeTimer
      :timer="timer"
      :duration-minutes="step.durationMinutes"
      @start="emit('timer-start')"
      @pause="emit('timer-pause')"
      @resume="emit('timer-resume')"
      @stop="emit('timer-stop')"
    />
  </div>
</template>
