<script setup lang="ts">
/**
 * CookingModeTimer - 烹饪计时器组件
 *
 * 接收当前步骤的计时器状态，通过 emit 与父组件通信
 */
interface TimerState {
  remaining: number
  isRunning: boolean
  isPaused: boolean
}

interface Props {
  timer: TimerState | undefined
  durationMinutes: number | undefined
}

const props = defineProps<Props>()

const emit = defineEmits<{
  start: []
  pause: []
  resume: []
  stop: []
}>()

const { t } = useI18n()

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const isComplete = computed(() => props.timer !== undefined && props.timer.remaining === 0)
</script>

<template>
  <div class="mt-8 flex flex-col items-center gap-3">
    <!-- Running / Paused Timer Display -->
    <div v-if="props.timer" class="flex flex-col items-center gap-2">
      <div
        class="text-5xl sm:text-6xl font-mono font-bold tracking-wider"
        :class="isComplete ? 'text-green-400 animate-pulse' : 'text-orange-400'"
      >
        {{ formatTime(props.timer.remaining) }}
      </div>

      <!-- Timer controls -->
      <div class="flex items-center gap-3">
        <!-- Done state -->
        <template v-if="isComplete">
          <span class="text-green-400 text-lg font-medium flex items-center gap-1">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            {{ t('cookingMode.timerDone') }}
          </span>
          <button
            @click="emit('stop')"
            class="px-4 py-2 rounded-full bg-stone-700 hover:bg-stone-600 text-stone-300 text-sm transition-colors"
          >
            {{ t('cookingMode.timerReset') }}
          </button>
        </template>

        <!-- Running state -->
        <template v-else-if="props.timer.isRunning">
          <button
            @click="emit('pause')"
            class="w-14 h-14 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center transition-colors"
            :aria-label="t('cookingMode.pause')"
          >
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
          <button
            @click="emit('stop')"
            class="w-14 h-14 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center transition-colors"
            :aria-label="t('cookingMode.stop')"
          >
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 000 2h4a1 1 0 100-2H8z" clip-rule="evenodd" />
            </svg>
          </button>
        </template>

        <!-- Paused state -->
        <template v-else>
          <button
            @click="emit('resume')"
            class="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-400 flex items-center justify-center transition-colors"
            :aria-label="t('cookingMode.resume')"
          >
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
            </svg>
          </button>
        </template>
      </div>
    </div>

    <!-- Start Timer Button -->
    <button
      v-if="!props.timer && props.durationMinutes"
      @click="emit('start')"
      class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-400 text-white font-semibold text-lg transition-colors"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
      </svg>
      {{ t('cookingMode.startTimer', { mins: props.durationMinutes }) }}
    </button>

    <!-- Duration hint (no timer started) -->
    <div
      v-else-if="props.durationMinutes && !props.timer"
      class="mt-6 text-stone-500 text-sm flex items-center justify-center gap-1.5"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {{ t('cookingMode.estimatedTime', { mins: props.durationMinutes }) }}
    </div>
  </div>
</template>
