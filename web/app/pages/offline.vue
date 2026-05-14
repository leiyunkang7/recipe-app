<script setup lang="ts">
/**
 * Offline Fallback Page
 *
 * Displayed when the user is offline and the network request times out.
 * Provides a friendly message and options to retry or go back to cached content.
 */
const { t } = useI18n()
const { isOffline, lastOnlineAt } = useOfflineStatus()

// Format the last online time
const formattedLastOnline = computed(() => {
  if (!lastOnlineAt.value) return null
  const date = new Date(lastOnlineAt.value)
  return date.toLocaleString()
})

// Retry going online
const handleRetry = () => {
  if (navigator.onLine) {
    window.location.reload()
  } else {
    alert(t('offline.stillOffline'))
  }
}

// Go back to previous page
const handleGoBack = () => {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    navigateTo('/')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-stone-900 dark:to-stone-800 flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center">
      <!-- Offline Icon -->
      <div class="mb-8">
        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-100 dark:bg-orange-900/30">
          <svg class="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        </div>
      </div>

      <!-- Title -->
      <h1 class="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-4">
        {{ t('offline.title') }}
      </h1>

      <!-- Description -->
      <p class="text-stone-600 dark:text-stone-400 mb-6">
        {{ t('offline.description') }}
      </p>

      <!-- Last Online Info -->
      <div v-if="formattedLastOnline" class="mb-8 p-4 bg-white dark:bg-stone-800 rounded-lg shadow-sm">
        <p class="text-sm text-stone-500 dark:text-stone-400">
          {{ t('offline.lastOnline') }}
        </p>
        <p class="text-stone-700 dark:text-stone-300 font-medium">
          {{ formattedLastOnline }}
        </p>
      </div>

      <!-- Cached Content Notice -->
      <div class="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div class="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-medium">{{ t('offline.cachedContent') }}</span>
        </div>
        <p class="mt-2 text-sm text-amber-600 dark:text-amber-500">
          {{ t('offline.cachedContentHint') }}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          @click="handleRetry"
          class="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ t('offline.retry') }}
        </button>

        <button
          @click="handleGoBack"
          class="px-6 py-3 bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 font-medium rounded-lg transition-colors border border-stone-300 dark:border-stone-600 flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {{ t('offline.goBack') }}
        </button>
      </div>

      <!-- Quick Links -->
      <div class="mt-12 pt-6 border-t border-stone-200 dark:border-stone-700">
        <p class="text-sm text-stone-500 dark:text-stone-400 mb-4">
          {{ t('offline.quickLinks') }}
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <NuxtLink to="/" class="text-orange-500 hover:text-orange-600 font-medium">
            {{ t('offline.home') }}
          </NuxtLink>
          <NuxtLink to="/favorites" class="text-orange-500 hover:text-orange-600 font-medium">
            {{ t('offline.favorites') }}
          </NuxtLink>
          <NuxtLink to="/profile" class="text-orange-500 hover:text-orange-600 font-medium">
            {{ t('offline.profile') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
