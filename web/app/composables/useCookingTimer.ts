/**
 * useCookingTimer - Cooking timer composable
 * 
 * Features:
 * - Multiple timers for different recipe steps
 * - Pause/resume functionality
 * - Toast notification when timer completes
 * - Sound alert (optional)
 */

export interface TimerState {
  stepId: string
  stepNumber: number
  duration: number // in seconds
  remaining: number // in seconds
  isRunning: boolean
  isPaused: boolean
}

export const useCookingTimer = () => {
  // Use useState for global state sharing across components
  const timers = useState<Map<string, TimerState>>('cooking-timers', () => new Map())
  const activeTimerId = useState<string | null>('active-timer-id', () => null)
  
  // Toast notification
  const showToast = (message: string) => {
    // Use the existing toast system if available
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('timer-complete', { detail: { message } })
      window.dispatchEvent(event)
    }
  }
  
  // Play sound alert
  const playAlert = () => {
    if (typeof window !== 'undefined') {
      try {
        const audio = new Audio('/sounds/timer-alert.mp3')
        audio.volume = 0.7
        audio.play().catch(() => {
          // Silently fail if audio can't play
        })
      } catch {
        // Ignore audio errors
      }
    }
  }
  
  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Timer tick interval reference
  const intervalId = ref<ReturnType<typeof setInterval> | null>(null)
  
  // Start or resume timer
  const startTimer = (stepId: string, stepNumber: number, durationMinutes: number) => {
    const durationSeconds = Math.max(1, Math.floor(durationMinutes * 60))
    
    // Check if timer already exists
    const existingTimer = timers.value.get(stepId)
    
    if (existingTimer) {
      // Resume paused timer
      existingTimer.isRunning = true
      existingTimer.isPaused = false
    } else {
      // Create new timer
      timers.value.set(stepId, {
        stepId,
        stepNumber,
        duration: durationSeconds,
        remaining: durationSeconds,
        isRunning: true,
        isPaused: false,
      })
    }
    
    activeTimerId.value = stepId
    
    // Start interval if not running
    if (!intervalId.value) {
      intervalId.value = setInterval(tick, 1000)
    }
  }
  
  // Timer tick
  const tick = () => {
    timers.value.forEach((timer, stepId) => {
      if (timer.isRunning && !timer.isPaused && timer.remaining > 0) {
        timer.remaining -= 1
        
        if (timer.remaining <= 0) {
          // Timer complete
          timer.isRunning = false
          timer.remaining = 0
          
          showToast(`步骤 ${timer.stepNumber} 计时完成！`)
          playAlert()
          
          // Remove completed timer
          timers.value.delete(stepId)
          
          if (activeTimerId.value === stepId) {
            activeTimerId.value = null
          }
        }
      }
    })
    
    // Stop interval if no active timers
    if (timers.value.size === 0 && intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }
  
  // Pause timer
  const pauseTimer = (stepId: string) => {
    const timer = timers.value.get(stepId)
    if (timer) {
      timer.isPaused = true
      timer.isRunning = false
    }
  }
  
  // Resume timer
  const resumeTimer = (stepId: string) => {
    const timer = timers.value.get(stepId)
    if (timer) {
      timer.isPaused = false
      timer.isRunning = true
      
      // Restart interval if needed
      if (!intervalId.value) {
        intervalId.value = setInterval(tick, 1000)
      }
    }
  }
  
  // Stop timer
  const stopTimer = (stepId: string) => {
    timers.value.delete(stepId)
    if (activeTimerId.value === stepId) {
      activeTimerId.value = null
    }
    
    if (timers.value.size === 0 && intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }
  
  // Reset timer to original duration
  const resetTimer = (stepId: string) => {
    const timer = timers.value.get(stepId)
    if (timer) {
      timer.remaining = timer.duration
      timer.isRunning = false
      timer.isPaused = false
    }
  }
  
  // Get timer for a step
  const getTimer = (stepId: string): TimerState | undefined => {
    return timers.value.get(stepId)
  }
  
  // Check if a step has an active timer
  const isTimerActive = (stepId: string): boolean => {
    const timer = timers.value.get(stepId)
    return timer ? timer.isRunning || timer.isPaused : false
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  })
  
  return {
    timers,
    activeTimerId,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    getTimer,
    isTimerActive,
    formatTime,
  }
}
