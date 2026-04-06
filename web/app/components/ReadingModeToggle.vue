<script setup lang="ts">
/**
 * ReadingModeToggle - Toggle controls for reading mode and eye protection mode
 *
 * Features:
 * - Toggle button for reading mode (simplified view)
 * - Toggle button for eye protection mode (warm sepia tones)
 * - Compact floating design
 */
const { t } = useI18n()

const {
  readingMode,
  eyeProtectionMode,
  toggleReadingMode,
  toggleEyeProtection,
} = useReadingMode()

const isOpen = ref(false)

const togglePanel = () => {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="fixed bottom-20 lg:bottom-8 right-4 z-50">
    <!-- Toggle Button -->
    <button
      @click="togglePanel"
      class="w-12 h-12 rounded-full bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-800 shadow-lg flex items-center justify-center hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
      :aria-label="t('readingMode.toggle')"
    >
      <svg v-if="!isOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Toggle Panel -->
    <Transition name="panel">
      <div
        v-if="isOpen"
        class="absolute bottom-14 right-0 bg-white dark:bg-stone-800 rounded-xl shadow-xl p-3 min-w-[200px]"
      >
        <div class="space-y-2">
          <!-- Reading Mode Toggle -->
          <button
            @click="toggleReadingMode"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            :class="readingMode
              ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
              : 'hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200'"
          >
            <span class="text-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            <span class="font-medium text-sm">{{ t('readingMode.readingMode') }}</span>
            <span class="ml-auto">
              <span
                class="inline-block w-10 h-6 rounded-full transition-colors relative"
                :class="readingMode ? 'bg-orange-500' : 'bg-stone-300 dark:bg-stone-600'"
              >
                <span
                  class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow"
                  :class="readingMode ? 'left-5' : 'left-1'"
                ></span>
              </span>
            </span>
          </button>

          <!-- Eye Protection Mode Toggle -->
          <button
            @click="toggleEyeProtection"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            :class="eyeProtectionMode
              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
              : 'hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200'"
          >
            <span class="text-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
            <span class="font-medium text-sm">{{ t('readingMode.eyeProtection') }}</span>
            <span class="ml-auto">
              <span
                class="inline-block w-10 h-6 rounded-full transition-colors relative"
                :class="eyeProtectionMode ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-600'"
              >
                <span
                  class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow"
                  :class="eyeProtectionMode ? 'left-5' : 'left-1'"
                ></span>
              </span>
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
