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
import { useTemperatureUnit } from '~/composables/useTemperatureUnit'
import { useAnalytics } from '~/composables/useAnalytics'
import { useSwipeGesture } from '~/composables/useSwipeGesture'
import { useWakeLock } from '~/composables/useWakeLock'
import CloseIcon from '~/components/icons/CloseIcon.vue'
import PauseIcon from '~/components/icons/PauseIcon.vue'
import ScreenLockIcon from '~/components/icons/ScreenLockIcon.vue'
import StopIcon from '~/components/icons/StopIcon.vue'
import ThermometerIcon from '~/components/icons/ThermometerIcon.vue'
import TimerIcon from '~/components/icons/TimerIcon.vue'
import ClockIcon from '~/components/icons/ClockIcon.vue'
import CheckCircleIcon from '~/components/icons/CheckCircleIcon.vue'
import PlayIcon from '~/components/icons/PlayIcon.vue'
import ChevronLeftIcon from '~/components/icons/ChevronLeftIcon.vue'
import ChevronRightIcon from '~/components/icons/ChevronRightIcon.vue'

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
const { formatTemp } = useTemperatureUnit()
const { trackCookingStart, trackStepComplete, trackCookingFinish, trackTimerStart } = useAnalytics()

// Current step
const currentStep = ref(props.initialStep)
const totalSteps = computed(() => props.recipe.steps?.length || 0)

// Wake Lock - delegated to shared composable to avoid duplicating logic
const {
  wakeLock,
  wakeLockSupported,
  acquire: acquireWakeLock,
  release: releaseWakeLock,
  setupVisibilityHandler,
  removeVisibilityHandler,
} = useWakeLock()

const onVisibilityChange = () => {
  if (document.visibilityState === 'visible' && props.show) {
    acquireWakeLock()
  }
}

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
    // Track step completion before advancing
    trackStepComplete(props.recipe, currentStep.value + 1)
    currentStep.value++
    emit('update:step', currentStep.value)
  }
}

// Increment cooking count when user finishes cooking
const finishCooking = async () => {
  // Track cooking finish for GA4 funnel analysis
  trackCookingFinish(props.recipe)
  if (props.recipe?.id) {
    await incrementCookingCount(props.recipe.id)
  }
  close()
}

const close = () => emit('update:show', false)

const goToStep = (index: number) => {
  currentStep.value = index
  emit('update:step', index)
}

// Keyboard navigation — only attach listener when cooking mode is visible
// to avoid intercepting keystrokes on other page elements when hidden
let keyboardListenerActive = false

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault()
    goNext()
  }
  if (e.key === 'Escape') close()
}

watch(() => props.show, (val) => {
  if (val) {
    currentStep.value = props.initialStep
    acquireWakeLock()
    setupVisibilityHandler()
    // Track cooking start for GA4 funnel analysis
    trackCookingStart(props.recipe)
    // Enable keyboard navigation only when visible
    if (!keyboardListenerActive) {
      document.addEventListener('keydown', onKeydown)
      keyboardListenerActive = true
    }
  } else {
    releaseWakeLock()
    removeVisibilityHandler()
    // Disable keyboard navigation when hidden
    if (keyboardListenerActive) {
      document.removeEventListener('keydown', onKeydown)
      keyboardListenerActive = false
    }
  }
})

// Swipe gesture for mobile step navigation with spring animation
const swipeContainer = ref<HTMLElement | null>(null)
const swipeOffset = ref(0)
const isSwiping = ref(false)
const hapticTriggered = ref(false)

// Spring animation parameters
const SPRING_STIFFNESS = 400
const SPRING_DAMPING = 30
let animationFrameId: number | null = null
let springVelocity = 0
const SWIPE_VISUAL_MULTIPLIER = 0.4 // Visual feedback is 40% of actual swipe distance
const SWIPE_MAX_VISUAL_OFFSET = 60 // Max visual offset in pixels
const VELOCITY_THRESHOLD = 0.3 // Minimum velocity to trigger navigation

// Calculate visual feedback threshold
const swipeThreshold = 50

/**
 * Spring animation for smooth swipe feedback
 */
const animateSpring = (targetOffset: number) => {
  const stiffness = SPRING_STIFFNESS
  const damping = SPRING_DAMPING

  const animate = () => {
    const currentOffset = swipeOffset.value
    const displacement = currentOffset - targetOffset
    const springForce = -stiffness * displacement
    const dampingForce = -damping * springVelocity
    const acceleration = springForce / 1000 // mass = 1000 for smoother animation

    springVelocity += acceleration * (16 / 1000)
    const newOffset = currentOffset + springVelocity * (16 / 1000)

    // Check if animation should end
    if (Math.abs(displacement) < 0.5 && Math.abs(springVelocity) < 0.5) {
      swipeOffset.value = targetOffset
      springVelocity = 0
      animationFrameId = null
      return
    }

    swipeOffset.value = newOffset
    animationFrameId = requestAnimationFrame(animate)
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  animationFrameId = requestAnimationFrame(animate)
}

useSwipeGesture(
  swipeContainer,
  {
    horizontal: true,
    threshold: swipeThreshold,
    preventScroll: true,
    hapticFeedback: true,
    onSwipeStart: () => {
      isSwiping.value = true
      hapticTriggered.value = false
      springVelocity = 0
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    },
    onSwipeMove: (state) => {
      // Provide smooth visual feedback with spring-like easing
      // The offset is proportional to the swipe distance but capped
      const rawOffset = state.distanceX * SWIPE_VISUAL_MULTIPLIER
      // Apply damping curve for natural feel - exponential decay as it approaches max
      const dampedOffset = Math.sign(rawOffset) * SWIPE_MAX_VISUAL_OFFSET * (1 - Math.exp(-Math.abs(rawOffset) / SWIPE_MAX_VISUAL_OFFSET))
      swipeOffset.value = Math.max(-SWIPE_MAX_VISUAL_OFFSET, Math.min(SWIPE_MAX_VISUAL_OFFSET, dampedOffset))
      // Trigger haptic when crossing threshold
      if (Math.abs(state.distanceX) > swipeThreshold && !hapticTriggered.value) {
        hapticTriggered.value = true
        if ('vibrate' in navigator) navigator.vibrate(10)
      }
    },
    onSwipeEnd: (state, direction) => {
      isSwiping.value = false
      hapticTriggered.value = false
      // Animate back to center with spring physics
      animateSpring(0)
      // Use velocity to determine if swipe is intentional
      const shouldNavigate = Math.abs(state.velocityX) > VELOCITY_THRESHOLD || Math.abs(state.distanceX) > swipeThreshold
      if (shouldNavigate) {
        if (direction.primary === 'left' && canGoNext.value) {
          if ('vibrate' in navigator) navigator.vibrate([10, 30, 10])
          goNext()
        } else if (direction.primary === 'right' && canGoPrev.value) {
          if ('vibrate' in navigator) navigator.vibrate([10, 30, 10])
          goPrev()
        }
      }
    },
    onSwipeCancel: () => {
      isSwiping.value = false
      hapticTriggered.value = false
      springVelocity = 0
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
      swipeOffset.value = 0
    }
  },
  { horizontal: true, vertical: false, threshold: swipeThreshold }
)

// Computed for swipe transform
const swipeTransform = computed(() => {
  if (!isSwiping.value && Math.abs(swipeOffset.value) < 0.1) return ''
  return `translateX(${swipeOffset.value}px)`
})


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
  // Track timer start for GA4 funnel analysis
  trackTimerStart(props.recipe, stepIndex + 1)
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
  // useWakeLock composable handles its own cleanup on unmount
  if (keyboardListenerActive) {
    document.removeEventListener('keydown', onKeydown)
    keyboardListenerActive = false
  }
  if (masterIntervalId) {
    clearInterval(masterIntervalId)
    masterIntervalId = null
  }
  // Cancel any pending spring animation to prevent memory leaks
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
})

// Progress
const progress = computed(() => {
  if (totalSteps.value === 0) return 0
  return Math.round(((currentStep.value + 1) / totalSteps.value) * 100)
})

// Timer button class helpers - extracted to avoid duplicating class strings in template
const timerButtonBaseClass = 'w-14 h-14 rounded-full flex items-center justify-center transition-colors'
const timerButtonPauseClass = `${timerButtonBaseClass} bg-stone-700 hover:bg-stone-600`
const timerButtonStopClass = `${timerButtonBaseClass} bg-stone-700 hover:bg-stone-600`
const timerButtonResumeClass = `${timerButtonBaseClass} bg-orange-500 hover:bg-orange-400`
</script>

<template>
  <Teleport to="body">
    <Transition name="cooking-mode">
      <div
        v-if="show"
        ref="swipeContainer"
        class="fixed inset-0 z-[100] flex flex-col bg-stone-900 text-white transition-transform duration-100"
        :style="{ transform: swipeTransform }"
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
              <CloseIcon class="w-5 h-5" />
              <span class="hidden sm:inline">{{ t('cookingMode.exit') }}</span>
            </button>

            <div class="h-6 w-px bg-stone-700 hidden sm:block"></div>

            <div class="hidden sm:flex items-center gap-2 text-stone-400 text-sm">
              <span>{{ t('cookingMode.stepOf', { current: currentStep + 1, total: totalSteps }) }}</span>
            </div>
          </div>

          <!-- Wake lock indicator -->
          <div v-if="wakeLockSupported && wakeLock" class="flex items-center gap-1.5 text-green-400 text-xs">
            <ScreenLockIcon class="w-4 h-4" />
            <span class="hidden sm:inline">{{ t('cookingMode.screenOn') }}</span>
          </div>
        </div>

        <!-- Progress Bar -->
        <div
          class="h-1 bg-stone-800 flex-shrink-0"
          role="progressbar"
          :aria-valuenow="progress"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="t('cookingMode.stepProgress', { current: currentStep + 1, total: totalSteps })"
        >
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

            <!-- Step image -->
            <div v-if="recipe.steps?.[currentStep]?.imageUrl" class="mb-6">
              <AppImage
                :src="recipe.steps[currentStep].imageUrl"
                :alt="t('recipe.stepImage', { step: currentStep + 1 })"
                class="max-w-full max-h-64 mx-auto rounded-xl"
                sizes="sm:100vw md:500px"
                object-fit="contain"
              />
            </div>

            <!-- Step instruction - large text for kitchen readability -->
            <p class="text-xl sm:text-2xl md:text-3xl leading-relaxed font-medium text-stone-100 whitespace-pre-wrap">
              {{ recipe.steps?.[currentStep]?.instruction }}
            </p>

            <!-- Temperature display -->
            <div v-if="recipe.steps?.[currentStep]?.temperature" class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 text-lg">
              <ThermometerIcon class="w-5 h-5" />
              <span>{{ formatTemp(recipe.steps[currentStep].temperature) }}</span>
            </div>

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
                      <CheckCircleIcon class="w-5 h-5" />
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
                      :class="timerButtonPauseClass"
                      :aria-label="t('cookingMode.pause')"
                    >
                      <PauseIcon class="w-6 h-6 text-white" />
                    </button>
                    <button
                      @click="stopTimer(currentStep)"
                      :class="timerButtonStopClass"
                      :aria-label="t('cookingMode.stop')"
                    >
                      <StopIcon class="w-6 h-6 text-white" />
                    </button>
                  </template>

                  <template v-else>
                    <button
                      @click="resumeTimer(currentStep)"
                      :class="timerButtonResumeClass"
                      :aria-label="t('cookingMode.resume')"
                    >
                      <PlayIcon class="w-6 h-6 text-white" />
                    </button>
                  </template>
                </div>
              </div>

              <!-- Start timer button -->
              <button
                v-if="!getTimer(currentStep)"
                @click="startTimer(currentStep)"
                class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-400 text-white font-semibold text-lg transition-colors"
                :aria-label="t('cookingMode.startTimerAria', { mins: recipe.steps?.[currentStep]?.durationMinutes })"
              >
                <ClockIcon class="w-5 h-5" />
                {{ t('cookingMode.startTimer', { mins: recipe.steps?.[currentStep]?.durationMinutes }) }}
              </button>
            </div>

            <!-- Duration hint if no timer started -->
            <div
              v-else-if="recipe.steps?.[currentStep]?.durationMinutes"
              class="mt-6 text-stone-500 text-sm flex items-center justify-center gap-1.5"
            >
              <ClockIcon class="w-4 h-4" />
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
            <ChevronLeftIcon class="w-5 h-5" />
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
            @click="canGoNext ? goNext() : finishCooking()"
            class="flex items-center gap-2 min-h-[52px] px-5 rounded-xl font-semibold text-base transition-colors"
            :class="canGoNext
              ? 'bg-orange-500 hover:bg-orange-400 text-white'
              : 'bg-green-600 hover:bg-green-500 text-white'"
            :aria-label="canGoNext ? t('cookingMode.nextStep') : t('cookingMode.finish')"
          >
            <span>{{ canGoNext ? t('cookingMode.next') : t('cookingMode.finish') }}</span>
            <ChevronRightIcon v-if="canGoNext" class="w-5 h-5" />
            <CheckCircleIcon v-else class="w-5 h-5" />
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
