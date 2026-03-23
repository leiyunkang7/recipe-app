<script setup lang="ts">
const { t } = useI18n()

const allTips = [
  {
    icon: 'heart',
    text: 'favorites.tip1',
    hint: 'favorites.tip1Hint',
    color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
    accentColor: 'border-rose-200 dark:border-rose-800'
  },
  {
    icon: 'browse',
    text: 'favorites.tip2',
    hint: 'favorites.tip2Hint',
    color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    accentColor: 'border-amber-200 dark:border-amber-800'
  },
  {
    icon: 'discover',
    text: 'favorites.tip3',
    hint: 'favorites.tip3Hint',
    color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    accentColor: 'border-emerald-200 dark:border-emerald-800'
  },
  {
    icon: 'chef',
    text: 'favorites.tip4',
    hint: 'favorites.tip4Hint',
    color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    accentColor: 'border-violet-200 dark:border-violet-800'
  },
  {
    icon: 'share',
    text: 'favorites.tip5',
    hint: 'favorites.tip5Hint',
    color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
    accentColor: 'border-cyan-200 dark:border-cyan-800'
  }
]

// Rotate tips based on time of day
const hour = new Date().getHours()
const tipOffset = hour % (allTips.length - 3)
const tips = computed(() => allTips.slice(tipOffset, tipOffset + 3))
</script>

<template>
  <div class="max-w-lg mx-auto mb-8">
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
      <div
        v-for="tip in tips"
        :key="tip.text"
        class="group flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border-2 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 w-full sm:w-auto"
        :class="tip.accentColor"
      >
        <div :class="tip.color" class="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 transition-transform group-hover:scale-110">
          <!-- Heart icon -->
          <svg v-if="tip.icon === 'heart'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <!-- Browse icon -->
          <svg v-else-if="tip.icon === 'browse'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
          </svg>
          <!-- Discover icon -->
          <svg v-else-if="tip.icon === 'discover'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <!-- Chef icon -->
          <svg v-else-if="tip.icon === 'chef'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          <!-- Share icon -->
          <svg v-else-if="tip.icon === 'share'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
          </svg>
        </div>
        <div class="text-left min-w-0 flex-1">
          <p class="text-sm font-semibold text-gray-900 dark:text-stone-100">{{ t(tip.text) }}</p>
          <p class="text-xs text-gray-500 dark:text-stone-400">{{ t(tip.hint) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
