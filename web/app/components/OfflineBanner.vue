<script setup lang="ts">
/**
 * OfflineBanner - 离线状态提示横幅组件
 *
 * 功能：
 * - 检测网络离线状态
 * - 固定在页面顶部显示
 * - 提示用户当前处于离线模式
 * - 显示同步状态
 * - 提供重试按钮
 *
 * 使用方式：
 * <OfflineBanner />
 */
const { t } = useI18n()
const { isOffline, syncStatus, lastOnlineAt } = useOfflineStatus()

const isRetrying = ref(false)

const handleRetry = async () => {
  if (navigator.onLine) {
    isRetrying.value = true
    // Small delay to show retrying state
    await new Promise(resolve => setTimeout(resolve, 500))
    window.location.reload()
  } else {
    alert(t('offline.stillOffline'))
  }
}

// Get message based on sync status
const syncMessage = computed(() => {
  switch (syncStatus.value) {
    case 'syncing':
      return t('offline.syncing')
    case 'error':
      return t('offline.syncError')
    default:
      return null
  }
})

// Format last online time
const lastOnlineFormatted = computed(() => {
  if (!lastOnlineAt.value) return null
  const now = new Date()
  const diff = now.getTime() - lastOnlineAt.value.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)

  if (minutes < 1) return t('offline.justNow')
  if (minutes < 60) return t('offline.minutesAgo', { minutes })
  if (hours < 24) return t('offline.hoursAgo', { hours })
  return lastOnlineAt.value.toLocaleDateString()
})
</script>

<template>
  <div
    v-if="isOffline"
    class="fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all duration-300"
    :class="[
      syncStatus === 'error'
        ? 'bg-red-500 text-white'
        : 'bg-amber-500 text-stone-900'
    ]"
  >
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
      <!-- Left: Icon and Message -->
      <div class="flex items-center gap-3 min-w-0">
        <!-- Offline Icon -->
        <div class="flex-shrink-0">
          <svg v-if="syncStatus === 'error'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        </div>

        <!-- Message -->
        <div class="min-w-0">
          <p class="font-medium text-sm truncate">
            {{ syncStatus === 'error' ? t('offline.syncError') : t('offline.message') }}
          </p>
          <p v-if="lastOnlineFormatted" class="text-xs opacity-80 truncate">
            {{ t('offline.lastOnline') }}: {{ lastOnlineFormatted }}
          </p>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Sync Status Indicator -->
        <div v-if="syncMessage" class="hidden sm:flex items-center gap-1 text-xs">
          <svg v-if="syncStatus === 'syncing'" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ syncMessage }}</span>
        </div>

        <!-- Retry Button -->
        <button
          @click="handleRetry"
          :disabled="isRetrying"
          class="px-3 py-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
          :class="syncStatus === 'error' ? 'text-white' : 'text-stone-900'"
        >
          <svg v-if="isRetrying" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ isRetrying ? t('offline.retrying') : t('offline.retry') }}
        </button>
      </div>
    </div>
  </div>
</template>
