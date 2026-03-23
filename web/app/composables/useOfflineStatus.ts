export const useOfflineStatus = () => {
  const isOffline = ref(false)

  if (import.meta.client) {
    isOffline.value = !navigator.onLine
    
    window.addEventListener('online', () => isOffline.value = false)
    window.addEventListener('offline', () => isOffline.value = true)
  }

  return { isOffline }
}
