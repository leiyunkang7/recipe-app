/**
 * useWakeLock - Screen wake lock composable
 *
 * Features:
 * - Request screen wake lock to prevent display from turning off
 * - Automatic reacquisition when page becomes visible again
 * - Automatic release when component unmounts
 */

export interface WakeLockState {
  wakeLock: WakeLockSentinel | null
  wakeLockSupported: boolean
  isActive: boolean
}

export const useWakeLock = () => {
  const wakeLock = ref<WakeLockSentinel | null>(null)
  const wakeLockSupported = ref(false)

  // Check if wake lock is currently active
  const isActive = computed(() => wakeLock.value !== null)

  // Acquire wake lock
  const acquire = async () => {
    if (!('wakeLock' in navigator)) return
    wakeLockSupported.value = true
    try {
      wakeLock.value = await navigator.wakeLock.request('screen')
    } catch {
      // Silently continue without wake lock
    }
  }

  // Release wake lock
  const release = () => {
    if (wakeLock.value) {
      wakeLock.value.release()
      wakeLock.value = null
    }
  }

  // Handle visibility change - reacquire wake lock when page becomes visible
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible' && wakeLockSupported.value) {
      acquire()
    }
  }

  // Setup visibility change listener
  const setupVisibilityHandler = () => {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  // Remove visibility change listener
  const removeVisibilityHandler = () => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    release()
    removeVisibilityHandler()
  })

  return {
    wakeLock,
    wakeLockSupported,
    isActive,
    acquire,
    release,
    setupVisibilityHandler,
    removeVisibilityHandler,
  }
}
