<script setup lang="ts">
/**
 * CacheSettings - 缓存设置组件
 *
 * 功能：
 * - 显示缓存使用情况
 * - 提供手动清除缓存选项
 * - 显示离线数据统计
 */

const { t } = useI18n()
const { isClearing, cacheInfo, recipeCacheStats, totalEstimatedSize, getCacheInfo, getRecipeCacheStats, clearAllOfflineData, clearBrowserCaches, clearIndexedDB, refreshCacheInfo } = useCacheManager()
const { isOffline, getCacheStorageInfo } = useOfflineStatus()

const isExpanded = ref(false)
const isRefreshing = ref(false)

// Local cache info (from Cache API)
const localCacheInfo = ref<Awaited<ReturnType<typeof getCacheStorageInfo>> | null>(null)

const refreshCacheInfoLocal = async () => {
  isRefreshing.value = true
  try {
    localCacheInfo.value = await getCacheStorageInfo()
    await refreshCacheInfo()
  } finally {
    isRefreshing.value = false
  }
}

const handleClearAll = async () => {
  if (!confirm(t('cache.clearAllConfirm'))) return
  await clearAllOfflineData()
  await refreshCacheInfoLocal()
}

const handleClearBrowserCache = async () => {
  if (!confirm(t('cache.clearCacheConfirm'))) return
  await clearBrowserCaches()
  await refreshCacheInfoLocal()
}

const handleClearIndexedDB = async () => {
  if (!confirm(t('cache.clearIdbConfirm'))) return
  await clearIndexedDB()
  await refreshCacheInfoLocal()
}

onMounted(refreshCacheInfoLocal)

// Format bytes to human readable size
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Calculate total cache size (approximate)
const totalCacheSize = computed(() => {
  if (!localCacheInfo.value) return '0 KB'
  const total = localCacheInfo.value.reduce((sum, cache) => {
    if (!cache.estimatedSize) return sum
    const sizeStr = cache.estimatedSize
    const match = sizeStr.match(/([\d.]+)\s*(\w+)/)
    if (match) {
      const value = parseFloat(match[1])
      const unit = match[2]
      if (unit === 'MB') return sum + value * 1024 * 1024
      if (unit === 'KB') return sum + value * 1024
      return sum + value
    }
    return sum
  }, 0)
  return formatBytes(total)
})
</script>

<template>
  <div class="border-t border-stone-200 dark:border-stone-700 pt-6 mt-6">
    <button
      @click="isExpanded = !isExpanded"
      class="flex items-center justify-between w-full text-left text-stone-700 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400"
    >
      <h3 class="font-medium flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7m-4 10V7m-4 10V7m-4 10V7m-1 10h16M5 7h14M5 17h14M5 7H3v10h2m14 0H21V7h-2M5 7h14" />
        </svg>
        {{ t('cache.title') }}
        <svg
          class="w-5 h-5 transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </h3>
    </button>

    <div v-show="isExpanded" class="mt-4 space-y-4">
      <!-- Cache Stats -->
      <div v-if="localCacheInfo" class="text-sm text-stone-600 dark:text-stone-400">
        <div class="flex items-center justify-between">
          <span>{{ t('cache.storageUsed') }}:</span>
          <span class="font-mono">{{ totalCacheSize }}</span>
        </div>
        <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          <template v-for="cache in localCacheInfo" :key="cache.cacheName">
            <div class="flex items-center justify-between">
              <span class="text-xs truncate">{{ cache.cacheName }}</span>
              <span class="text-xs">{{ cache.estimatedSize }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Cache Controls -->
      <div class="flex flex-wrap gap-2 pt-2">
        <button
          @click="refreshCacheInfoLocal"
          :disabled="isRefreshing"
          class="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm rounded-md transition-colors"
        >
          {{ isRefreshing ? t('cache.refreshing') : t('cache.refresh') }}
        </button>
        <button
          @click="handleClearAll"
          :disabled="isClearing"
          class="px-3 py-1.5 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 text-sm rounded-md transition-colors"
        >
          {{ t('cache.clearAll') }}
        </button>
        <button
          @click="handleClearBrowserCache"
          :disabled="isClearing"
          class="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-300 text-sm rounded-md transition-colors"
        >
          {{ t('cache.clearCache') }}
        </button>
        <button
          @click="handleClearIndexedDB"
          :disabled="isClearing"
          class="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/50 hover:bg-orange-200 dark:hover:bg-orange-800 text-orange-700 dark:text-orange-300 text-sm rounded-md transition-colors"
        >
          {{ t('cache.clearIdb') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>