import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock window for timer complete event
const mockDispatchEvent = vi.fn()
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

// Mock Audio
const mockAudioPlay = vi.fn().mockResolvedValue(undefined)
vi.stubGlobal('window', {
  dispatchEvent: mockDispatchEvent,
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
})

vi.stubGlobal('Audio', vi.fn().mockImplementation(() => ({
  play: mockAudioPlay,
  volume: 0.7,
})))

describe('useCookingTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('formatTime', () => {
    it('should format seconds as MM:SS', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { formatTime } = useCookingTimer()

      expect(formatTime(0)).toBe('00:00')
      expect(formatTime(59)).toBe('00:59')
      expect(formatTime(60)).toBe('01:00')
      expect(formatTime(90)).toBe('01:30')
      expect(formatTime(125)).toBe('02:05')
      expect(formatTime(3600)).toBe('60:00')
    })
  })

  describe('startTimer', () => {
    it('should create a new timer with correct duration', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { startTimer, timers, getTimer } = useCookingTimer()

      startTimer('step-1', 1, 5) // 5 minutes

      const timer = getTimer('step-1')
      expect(timer).toBeDefined()
      expect(timer!.duration).toBe(300) // 5 * 60 seconds
      expect(timer!.remaining).toBe(300)
      expect(timer!.isRunning).toBe(true)
      expect(timer!.isPaused).toBe(false)
    })

    it('should set timer to minimum 1 second if duration is very small', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { startTimer, getTimer } = useCookingTimer()

      startTimer('step-1', 1, 0.001) // Very small duration

      const timer = getTimer('step-1')
      expect(timer!.duration).toBe(1) // Minimum 1 second
    })

    it('should set activeTimerId when starting a timer', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { startTimer, activeTimerId } = useCookingTimer()

      startTimer('step-1', 1, 5)

      expect(activeTimerId.value).toBe('step-1')
    })
  })

  describe('pauseTimer', () => {
    it('should pause a running timer', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { startTimer, pauseTimer, getTimer } = useCookingTimer()

      startTimer('step-1', 1, 5)
      pauseTimer('step-1')

      const timer = getTimer('step-1')
      expect(timer!.isPaused).toBe(true)
      expect(timer!.isRunning).toBe(false)
    })
  })

  describe('resumeTimer', () => {
    it('should resume a paused timer', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { startTimer, pauseTimer, resumeTimer, getTimer } = useCookingTimer()

      startTimer('step-1', 1, 5)
      pauseTimer('step-1')
      resumeTimer('step-1')

      const timer = getTimer('step-1')
      expect(timer!.isPaused).toBe(false)
      expect(timer!.isRunning).toBe(true)
    })
  })

  describe('stopTimer', () => {
    it('should remove a timer completely', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { startTimer, stopTimer, getTimer } = useCookingTimer()

      startTimer('step-1', 1, 5)
      stopTimer('step-1')

      expect(getTimer('step-1')).toBeUndefined()
    })

    it('should clear activeTimerId when stopping the active timer', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { startTimer, stopTimer, activeTimerId } = useCookingTimer()

      startTimer('step-1', 1, 5)
      stopTimer('step-1')

      expect(activeTimerId.value).toBeNull()
    })
  })

  describe('resetTimer', () => {
    it('should reset timer remaining to original duration', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { startTimer, resetTimer, getTimer } = useCookingTimer()

      startTimer('step-1', 1, 5)
      // Advance some time
      vi.advanceTimersByTime(10000) // 10 seconds

      resetTimer('step-1')

      const timer = getTimer('step-1')
      expect(timer!.remaining).toBe(300) // Back to original
      expect(timer!.isRunning).toBe(false)
      expect(timer!.isPaused).toBe(false)
    })
  })

  describe('getTimer', () => {
    it('should return undefined for non-existent timer', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { getTimer } = useCookingTimer()

      expect(getTimer('non-existent')).toBeUndefined()
    })
  })

  describe('isTimerActive', () => {
    it('should return true for running timer', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { startTimer, isTimerActive } = useCookingTimer()

      startTimer('step-1', 1, 5)

      expect(isTimerActive('step-1')).toBe(true)
    })

    it('should return true for paused timer', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { startTimer, pauseTimer, isTimerActive } = useCookingTimer()

      startTimer('step-1', 1, 5)
      pauseTimer('step-1')

      expect(isTimerActive('step-1')).toBe(true)
    })

    it('should return false for non-existent timer', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { isTimerActive } = useCookingTimer()

      expect(isTimerActive('non-existent')).toBe(false)
    })
  })

  describe('timer countdown', () => {
    it('should decrement remaining time each second', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { startTimer, getTimer } = useCookingTimer()

      startTimer('step-1', 1, 5) // 5 minutes = 300 seconds
      vi.advanceTimersByTime(3000) // 3 seconds

      const timer = getTimer('step-1')
      expect(timer!.remaining).toBe(297)
    })

    it('should dispatch timer-complete event when timer finishes', async () => {
      const { useCookingTimer } = await import('./useCookingTimer')
      const { startTimer } = useCookingTimer()

      startTimer('step-1', 1, 1/60) // 1 second timer
      vi.advanceTimersByTime(1100) // Just over 1 second

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'timer-complete',
          detail: expect.objectContaining({
            message: expect.stringContaining('步骤 1')
          })
        })
      )
    })
  })
})