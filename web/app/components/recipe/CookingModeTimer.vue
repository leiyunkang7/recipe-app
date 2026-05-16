<script setup lang="ts">
/**
 * CookingModeTimer - 烹饪计时器组件
 *
 * 接收当前步骤的计时器状态，通过 emit 与父组件通信
 */
import PauseIcon from '~/components/icons/PauseIcon.vue'
import StopIcon from '~/components/icons/StopIcon.vue'
import PlayIcon from '~/components/icons/PlayIcon.vue'
import ClockIcon from '~/components/icons/ClockIcon.vue'

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
            <PauseIcon class="w-6 h-6 text-white" />
          </button>
          <button
            @click="emit('stop')"
            class="w-14 h-14 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center transition-colors"
            :aria-label="t('cookingMode.stop')"
          >
            <StopIcon class="w-6 h-6 text-white" />
          </button>
        </template>

        <!-- Paused state -->
        <template v-else>
          <button
            @click="emit('resume')"
            class="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-400 flex items-center justify-center transition-colors"
            :aria-label="t('cookingMode.resume')"
          >
            <PlayIcon class="w-6 h-6 text-white" />
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
      <ClockIcon class="w-4 h-4" />
      {{ t('cookingMode.estimatedTime', { mins: props.durationMinutes }) }}
    </div>
  </div>
</template>
