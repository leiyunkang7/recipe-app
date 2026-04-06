<script setup lang="ts">
/**
 * CookingMode - 全屏烹饪模式组件
 *
 * 功能：
 * - 全屏一步一屏的烹饪体验
 * - 大字体，易于厨房阅读
 * - 集成计时器（每个步骤可独立计时）
 * - 屏幕常亮（Wake Lock API）
 * - 上一步/下一步导航
 * - 步骤进度指示器
 * - 键盘导航支持
 */
import type { Recipe } from '~/types'

interface Props {
  show: boolean
  recipe: Recipe
  initialStep?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialStep: 0,
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  'update:step': [step: number]
}>()

const { t } = useI18n()
const { incrementCookingCount } = useRecipes()

// Current step
const currentStep = ref(props.initialStep)
const totalSteps = computed(() => props.recipe.steps?.length || 0)

// Wake Lock
const wakeLock = ref<WakeLockSentinel | null>(null)
const wakeLockSupported = ref(false)

const acquireWakeLock = async () => {
  if (!('wakeLock' in navigator)) return
  wakeLockSupported.value = true
  try {
    wakeLock.value = await navigator.wakeLock.request('screen')
  } catch {
    // Silently continue without wake lock
  }
}

const releaseWakeLock = () => {
  if (wakeLock.value) {
    wakeLock.value.release()
    wakeLock.value = null
  }
}

const onVisibilityChange = () => {
  if (document.visibilityState === 'visible' && props.show) {
    acquireWakeLock()
  }
}

watch(() => props.show, (val) => {
  if (val) {
    currentStep.value = props.initialStep
    acquireWakeLock()
    document.addEventListener('visibilitychange', onVisibilityChange)
  } else {
    releaseWakeLock()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
})

onUnmounted(() => {
  releaseWakeLock()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

// Navigation
const canGoPrev = computed(() => currentStep.value > 0)
const canGoNext = computed(() => currentStep.value < totalSteps.value - 1)

const goPrev = () => {
  if (canGoPrev.value) {
    currentStep.value--
    emit('update:step', currentStep.value)
  }
}

const goNext = () => {
  if (canGoNext.value) {
    currentStep.value++
    emit('update:step', currentStep.value)
  }
}

// Increment cooking count when user finishes cooking
const finishCooking = async () => {
  if (props.recipe?.id) {
    await incrementCookingCount(props.recipe.id)
  }
  close()
}

const close = () => emit('update:show', false)

// Keyboard navigation
const onKeydown = (e: KeyboardEvent) => {
  if (!props.show) return
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault()
    goNext()
  }
  if (e.key === 'Escape') close()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

// Timers - use plain Map with reactive version counter to avoid triggering Vue deep reactivity on every tick
// This prevents unnecessary re-renders when multiple timers are active (was: N re-renders per second per timer)
const timers = new Map<string, { totalSeconds: number; startTime: number; isRunning: boolean; isPaused: boolean }>()
const timerVersion = ref(0)
let masterIntervalId: ReturnType<typeof setInterval> | null = null

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const getTimerKey = (stepIndex: number) => `step-${stepIndex}`

// Timer state getter - returns reactive state based on elapsed time
// Depends on timerVersion to trigger re-renders only when timer state changes
const getTimerState = (stepIndex: number) => {
  const key = getTimerKey(stepIndex)
  const timer = timers.get(key)
  if (!timer) return null

  const elapsed = timer.isPaused
    ? 0
    : timer.isRunning
      ? Math.floor((Date.now() - timer.startTime) / 1000)
      : 0

  const remaining = Math.max(0, timer.totalSeconds - elapsed)
  return {
    remaining,
    isRunning: timer.isRunning && remaining > 0,
    isPaused: timer.isPaused && remaining > 0,
    isDone: remaining === 0 && !timer.isPaused,
  }
}

// Master interval - only increments version to trigger UI update, no direct DOM changes
const startMasterInterval = () => {
  if (masterIntervalId) return
  masterIntervalId = setInterval(() => {
    let hasActive = false
    timers.forEach((timer, key) => {
      if (timer.isRunning) {
        const elapsed = Math.floor((Date.now() - timer.startTime) / 1000)
        const remaining = timer.totalSeconds - elapsed
        if (remaining <= 0) {
          timer.isRunning = false
          timer.isPaused = false
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
        }
        hasActive = true
      }
    })
    // Increment version to trigger UI update based on elapsed time
    timerVersion.value++
    if (!hasActive) {
      clearInterval(masterIntervalId!)
      masterIntervalId = null
    }
  }, 1000)
}

const startTimer = (stepIndex: number) => {
  const step = props.recipe.steps?.[stepIndex]
  if (!step?.durationMinutes) return
  const key = getTimerKey(stepIndex)
  const totalSeconds = Math.floor(step.durationMinutes * 60)
  timers.set(key, { totalSeconds, startTime: Date.now(), isRunning: true, isPaused: false })
  timerVersion.value++
  startMasterInterval()
}

const pauseTimer = (stepIndex: number) => {
  const timer = timers.get(getTimerKey(stepIndex))
  if (timer) {
    // Adjust totalSeconds to account for elapsed time
    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000)
    timer.totalSeconds = Math.max(0, timer.totalSeconds - elapsed)
    timer.isRunning = false
    timer.isPaused = true
    timerVersion.value++
  }
}

const resumeTimer = (stepIndex: number) => {
  const timer = timers.get(getTimerKey(stepIndex))
  if (timer) {
    timer.startTime = Date.now()
    timer.isRunning = true
    timer.isPaused = false
    timerVersion.value++
    startMasterInterval()
  }
}

const stopTimer = (stepIndex: number) => {
  timers.delete(getTimerKey(stepIndex))
  timerVersion.value++
  // If no more active timers, stop the master interval
  let hasActive = false
  timers.forEach((timer) => {
    if (timer.isRunning) hasActive = true
  })
  if (!hasActive && masterIntervalId) {
    clearInterval(masterIntervalId)
    masterIntervalId = null
  }
}

const getTimer = (stepIndex: number) => getTimerState(stepIndex)
const hasTimer = (stepIndex: number) => !!props.recipe.steps?.[stepIndex]?.durationMinutes
const isTimerComplete = (stepIndex: number) => {
  const t = getTimer(stepIndex)
  return t !== null && t.isDone
}

onUnmounted(() => {
  if (masterIntervalId) {
    clearInterval(masterIntervalId)
    masterIntervalId = null
  }
  // Note: releaseWakeLock and visibilitychange listener are already handled
  // by the watch(() => props.show, ...) when show becomes false.
  // If unmounted while show=true, WakeLock is still released here.
  releaseWakeLock()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

// Progress
const progress = computed(() => {
  if (totalSteps.value === 0) return 0
  return Math.round(((currentStep.value + 1) / totalSteps.value) * 100)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="cooking-mode">
      <div
        v-if="show"
        class="fixed inset-0 z-[100] flex flex-col bg-stone-900 text-white"
        role="dialog"
        aria-modal="true"
        :aria-label="`${t('cookingMode.title')} - ${recipe.title}`"
      >
        <!-- Top Bar -->
        <div class="flex items-center justify-between px-4 py-3 bg-stone-800 border-b border-stone-700 flex-shrink-0">
          <div class="flex items-center gap-3">
            <button
              @click="close"
              class="flex items-center gap-1.5 text-stone-400 hover:text-white transition-colors text-sm font-medium min-w-[44px] min-h-[44px] justify-center rounded-lg hover:bg-stone-700"
              :aria-label="t('cookingMode.exit')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span class="hidden sm:inline">{{ t('cookingMode.exit') }}</span>
            </button>

            <div class="h-6 w-px bg-stone-700 hidden sm:block"></div>

            <div class="hidden sm:flex items-center gap-2 text-stone-400 text-sm">
              <span>{{ t('cookingMode.stepOf', { current: currentStep + 1, total: totalSteps }) }}</span>
            </div>
          </div>

          <!-- Wake lock indicator -->
          <div v-if="wakeLockSupported && wakeLock" class="flex items-center gap-1.5 text-green-400 text-xs">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
            </svg>
            <span class="hidden sm:inline">{{ t('cookingMode.screenOn') }}</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="h-1 bg-stone-800 flex-shrink-0">
          <div
            class="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col justify-center px-4 sm:px-8 py-6 overflow-hidden">
          <div class="max-w-2xl mx-auto w-full text-center">
            <!-- Step number badge -->
            <div class="mb-6">
              <span class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 text-orange-400 text-2xl font-bold">
                {{ currentStep + 1 }}
              </span>
            </div>

            <!-- Step instruction - large text for kitchen readability -->
            <p class="text-xl sm:text-2xl md:text-3xl leading-relaxed font-medium text-stone-100 whitespace-pre-wrap">
              {{ recipe.steps?.[currentStep]?.instruction }}
            </p>

            <!-- Timer Section -->
            <div v-if="hasTimer(currentStep)" class="mt-8 flex flex-col items-center gap-3">
              <div
                v-if="getTimer(currentStep)"
                class="flex flex-col items-center gap-2"
              >
                <!-- Timer display -->
                <div
                  class="text-5xl sm:text-6xl font-mono font-bold tracking-wider"
                  :class="isTimerComplete(currentStep) ? 'text-green-400 animate-pulse' : 'text-orange-400'"
                >
                  {{ formatTime(getTimer(currentStep)!.remaining) }}
                </div>

                <!-- Timer controls -->
                <div class="flex items-center gap-3">
                  <template v-if="isTimerComplete(currentStep)">
                    <span class="text-green-400 text-lg font-medium flex items-center gap-1">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      {{ t('cookingMode.timerDone') }}
                    </span>
                    <button
                      @click="stopTimer(currentStep)"
                      class="px-4 py-2 rounded-full bg-stone-700 hover:bg-stone-600 text-stone-300 text-sm transition-colors"
                    >
                      {{ t('cookingMode.timerReset') }}
                    </button>
                  </template>

                  <template v-else-if="getTimer(currentStep)!.isRunning">
                    <button
                      @click="pauseTimer(currentStep)"
                      class="w-14 h-14 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center transition-colors"
                      :aria-label="t('cookingMode.pause')"
                    >
                      <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                    <button
                      @click="stopTimer(currentStep)"
                      class="w-14 h-14 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center transition-colors"
                      :aria-label="t('cookingMode.stop')"
                    >
                      <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 000 2h4a1 1 0 100-2H8z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </template>

                  <template v-else>
                    <button
                      @click="resumeTimer(currentStep)"
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

              <!-- Start timer button -->
              <button
                v-if="!getTimer(currentStep)"
                @click="startTimer(currentStep)"
                class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-400 text-white font-semibold text-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                </svg>
                {{ t('cookingMode.startTimer', { mins: recipe.steps?.[currentStep]?.durationMinutes }) }}
              </button>
            </div>

            <!-- Duration hint if no timer started -->
            <div
              v-else-if="recipe.steps?.[currentStep]?.durationMinutes"
              class="mt-6 text-stone-500 text-sm flex items-center justify-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ t('cookingMode.estimatedTime', { mins: recipe.steps?.[currentStep]?.durationMinutes }) }}
            </div>
          </div>
        </div>

        <!-- Bottom Navigation -->
        <div class="flex items-center justify-between px-4 py-4 bg-stone-800 border-t border-stone-700 flex-shrink-0">
          <!-- Prev button -->
          <button
            @click="goPrev"
            :disabled="!canGoPrev"
            class="flex items-center gap-2 min-h-[52px] px-5 rounded-xl font-semibold text-base transition-colors"
            :class="canGoPrev
              ? 'bg-stone-700 hover:bg-stone-600 text-white'
              : 'bg-stone-800 text-stone-600 cursor-not-allowed'"
            :aria-label="t('cookingMode.prevStep')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>{{ t('cookingMode.prev') }}</span>
          </button>

          <!-- Step dots -->
          <div class="flex items-center gap-1.5 overflow-x-auto max-w-[40vw]">
            <button
              v-for="(_, i) in recipe.steps"
              :key="i"
              @click="currentStep = i; emit('update:step', i)"
              class="w-2.5 h-2.5 rounded-full transition-all flex-shrink-0 min-w-[10px]"
              :class="i === currentStep
                ? 'bg-orange-500 w-6'
                : i < currentStep
                  ? 'bg-orange-500/50 hover:bg-orange-500/70'
                  : 'bg-stone-600 hover:bg-stone-500'"
              :aria-label="`${t('cookingMode.goToStep')} ${i + 1}`"
              :aria-current="i === currentStep ? 'step' : undefined"
            ></button>
          </div>

          <!-- Next / Finish button -->
          <button
            @click="canGoNext ? goNext() : finishCooking()"
            class="flex items-center gap-2 min-h-[52px] px-5 rounded-xl font-semibold text-base transition-colors"
            :class="canGoNext
              ? 'bg-orange-500 hover:bg-orange-400 text-white'
              : 'bg-green-600 hover:bg-green-500 text-white'"
            :aria-label="canGoNext ? t('cookingMode.nextStep') : t('cookingMode.finish')"
          >
            <span>{{ canGoNext ? t('cookingMode.next') : t('cookingMode.finish') }}</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="canGoNext" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cooking-mode-enter-active,
.cooking-mode-leave-active {
  transition: opacity 0.25s ease;
}
.cooking-mode-enter-from,
.cooking-mode-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .cooking-mode-enter-active,
  .cooking-mode-leave-active {
    transition: none;
  }
}
</style>
