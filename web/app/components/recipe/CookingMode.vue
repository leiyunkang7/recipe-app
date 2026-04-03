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

// ─── Current Step ────────────────────────────────────────────────
const currentStep = ref(props.initialStep)
const totalSteps = computed(() => props.recipe.steps?.length || 0)

// ─── Wake Lock ──────────────────────────────────────────────────
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

// ─── Navigation ───────────────────────────────────────────────────
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

const close = () => emit('update:show', false)

const goToStep = (i: number) => {
  currentStep.value = i
  emit('update:step', i)
}

// ─── Keyboard Navigation ──────────────────────────────────────────
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

// ─── Timers ──────────────────────────────────────────────────────
const timers = ref<Map<string, { remaining: number; isRunning: boolean; isPaused: boolean }>>(new Map())
let timerInterval: ReturnType<typeof setInterval> | null = null
let _activeTimerId: ReturnType<typeof setInterval> | null = null

const getTimerKey = (stepIndex: number) => `step-${stepIndex}`
const getTimer = (stepIndex: number) => timers.value.get(getTimerKey(stepIndex))
const hasTimer = (stepIndex: number) => !!props.recipe.steps?.[stepIndex]?.durationMinutes

const _tick = () => {
  let hasActive = false
  timers.value.forEach((timer) => {
    if (timer.isRunning && timer.remaining > 0) {
      timer.remaining--
      hasActive = true
      if (timer.remaining === 0) {
        timer.isRunning = false
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
      }
    }
  })
  if (!hasActive && timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
    _activeTimerId = null
  }
}

const _ensureInterval = () => {
  if (!timerInterval) {
    _activeTimerId = setInterval(() => {
      timerInterval = _activeTimerId
      _tick()
    }, 1000)
  }
}

const startTimer = (stepIndex: number) => {
  const step = props.recipe.steps?.[stepIndex]
  if (!step?.durationMinutes) return
  const key = getTimerKey(stepIndex)
  const totalSeconds = Math.floor(step.durationMinutes * 60)
  timers.value.set(key, { remaining: totalSeconds, isRunning: true, isPaused: false })
  _ensureInterval()
}

const pauseTimer = (stepIndex: number) => {
  const timer = timers.value.get(getTimerKey(stepIndex))
  if (timer) { timer.isRunning = false; timer.isPaused = true }
}

const resumeTimer = (stepIndex: number) => {
  const timer = timers.value.get(getTimerKey(stepIndex))
  if (timer) {
    timer.isRunning = true
    timer.isPaused = false
    _ensureInterval()
  }
}

const stopTimer = (stepIndex: number) => {
  timers.value.delete(getTimerKey(stepIndex))
}

onUnmounted(() => {
  if (_activeTimerId) { clearInterval(_activeTimerId); _activeTimerId = null }
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
  releaseWakeLock()
})

// ─── Progress ────────────────────────────────────────────────────
const progress = computed(() => {
  if (totalSteps.value === 0) return 0
  return Math.round(((currentStep.value + 1) / totalSteps.value) * 100)
})

// ─── Current Step Data ───────────────────────────────────────────
const currentStepData = computed(() => props.recipe.steps?.[currentStep.value])
const currentTimer = computed(() => getTimer(currentStep.value))
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
        <CookingModeProgress :progress="progress" />

        <!-- Main Content -->
        <div class="flex-1 flex flex-col justify-center px-4 sm:px-8 py-6 overflow-hidden">
          <CookingModeStep
            v-if="currentStepData"
            :step="currentStepData"
            :step-index="currentStep"
            :timer="currentTimer"
            @timer-start="startTimer(currentStep)"
            @timer-pause="pauseTimer(currentStep)"
            @timer-resume="resumeTimer(currentStep)"
            @timer-stop="stopTimer(currentStep)"
          />
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
              @click="goToStep(i)"
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
            @click="canGoNext ? goNext() : close()"
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
