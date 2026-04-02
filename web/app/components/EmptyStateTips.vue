<script setup lang="ts">
const { t } = useI18n()

const tips = [
  {
    icon: 'edit',
    text: 'empty.step1',
    hint: 'empty.step1Hint',
    color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    bgHover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
    accentColor: 'border-orange-200 dark:border-orange-800',
    step: 1,
    emoji: '📝'
  },
  {
    icon: 'camera',
    text: 'empty.step2',
    hint: 'empty.step2Hint',
    color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    accentColor: 'border-emerald-200 dark:border-emerald-800',
    step: 2,
    emoji: '📷'
  },
  {
    icon: 'sparkles',
    text: 'empty.step3',
    hint: 'empty.step3Hint',
    color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    bgHover: 'hover:bg-violet-50 dark:hover:bg-violet-900/20',
    accentColor: 'border-violet-200 dark:border-violet-800',
    step: 3,
    emoji: '✨'
  },
  {
    icon: 'search',
    text: 'empty.tipSearch',
    hint: 'empty.tipSearchHint',
    color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    accentColor: 'border-blue-200 dark:border-blue-800',
    step: null,
    emoji: '🔍'
  },
  {
    icon: 'category',
    text: 'empty.tipBrowse',
    hint: 'empty.tipBrowseHint',
    color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
    accentColor: 'border-amber-200 dark:border-amber-800',
    step: null,
    emoji: '🏷️'
  }
]

// Show first 3 tips, but rotate which ones based on time of day
const hour = new Date().getHours()
const tipOffset = hour % (tips.length - 3)
const displayTips = computed(() => tips.slice(tipOffset, tipOffset + 3))

// Calculate progress percentage for steps
const stepProgress = computed(() => {
  const steps = displayTips.value.filter(t => t.step !== null)
  if (steps.length === 0) return 0
  const maxStep = Math.max(...steps.map(t => t.step!))
  return (maxStep / 3) * 100
})

// Animated checkmarks for completed steps (simulate some progress)
const completedSteps = computed(() => Math.floor(Math.random() * 2))
</script>

<template>
  <div class="mb-6">
    <!-- Header with progress -->
    <div class="flex items-center gap-3 mb-5">
      <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 dark:from-orange-400 dark:to-amber-400 shadow-lg shadow-orange-500/30 dark:shadow-orange-400/20">
        <svg class="w-5 h-5 text-white dark:text-orange-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>
      <span class="text-base font-bold text-gray-800 dark:text-stone-100">{{ t('empty.gettingStarted') }}</span>
      <div class="flex-1 h-0.5 bg-gradient-to-r from-gray-200 via-amber-200 to-transparent dark:from-gray-700 dark:via-amber-800 rounded-full"></div>
      <!-- Progress indicator -->
      <div class="hidden sm:flex items-center gap-2">
        <div class="relative w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            class="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 via-amber-400 to-amber-500 rounded-full transition-all duration-700 ease-out"
            :style="{ width: `${stepProgress}%` }"
          ></div>
          <!-- Shimmer effect -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/10 animate-shimmer"></div>
        </div>
        <span class="text-xs text-gray-500 dark:text-stone-400 font-semibold">{{ Math.round(stepProgress) }}%</span>
      </div>
    </div>

    <!-- Steps cards -->
    <div class="flex flex-col sm:flex-row items-stretch justify-center gap-4">
      <div
        v-for="(item, index) in displayTips"
        :key="item.icon + index"
        class="group relative flex items-center gap-4 px-5 py-4 bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-default"
        :class="[item.bgHover, item.accentColor]"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <!-- Connecting line between steps -->
        <div v-if="index < displayTips.length - 1" class="hidden sm:block absolute -right-5 top-1/2 w-10 h-0.5 bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700 z-10"></div>

        <!-- Step number badge (for guided steps) -->
        <div v-if="item.step" class="absolute -top-2.5 -left-2.5 w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
          <span v-if="item.step <= completedSteps" class="text-white dark:text-orange-900 text-xs font-bold">✓</span>
          <span v-else class="text-white dark:text-orange-900 text-xs font-bold">{{ item.step }}</span>
        </div>

        <!-- Emoji badge -->
        <div class="text-2xl animate-bounce" :style="{ animationDuration: `${2 + index * 0.3}s`, animationDelay: `${index * 0.2}s` }">
          {{ item.emoji }}
        </div>

        <!-- Content -->
        <div class="text-left min-w-0 flex-1">
          <p class="text-sm font-bold text-gray-900 dark:text-stone-100 mb-0.5">{{ t(item.text) }}</p>
          <p class="text-xs text-gray-500 dark:text-stone-400">{{ t(item.hint) }}</p>
        </div>

        <!-- Arrow for last step -->
        <div v-if="item.step === 3" class="absolute -right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs shadow-md">
          →
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
  }
}
</style>
