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
const { wakeLock, wakeLockSupported, acquire, release, setupVisibilityHandler, removeVisibilityHandler } = useWakeLock()

watch(() => props.show, (val) => {
  if (val) {
    currentStep.value = props.initialStep
    acquire()
    setupVisibilityHandler()
  } else {
    release()
    removeVisibilityHandler()
  }
})

onUnmounted(() => {
  release()
  removeVisibilityHandler()
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
  release()
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
        <CookingModeTopBar
          :current-step="currentStep"
          :total-steps="totalSteps"
          :wake-lock-supported="wakeLockSupported"
          :wake-lock="wakeLock"
          @close="close"
        />

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
        <CookingModeBottomNav
          :recipe="recipe"
          :current-step="currentStep"
          :total-steps="totalSteps"
          :can-go-prev="canGoPrev"
          :can-go-next="canGoNext"
          @prev="goPrev"
          @next="goNext"
          @close="close"
          @go-to-step="goToStep"
        />
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
