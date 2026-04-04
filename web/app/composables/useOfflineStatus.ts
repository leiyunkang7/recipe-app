export const useOfflineStatus = () => {
  const isOffline = ref(false)

  const updateOnlineStatus = () => {
    isOffline.value = !navigator.onLine
  }

  onMounted(() => {
    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  })

  return { isOffline }
}
