<script setup lang="ts">
const { t } = useI18n()

const tips = [
  {
    icon: 'search',
    text: 'empty.tip1',
    color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    hint: 'empty.tip1Hint'
  },
  {
    icon: 'tag',
    text: 'empty.tip2',
    color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    hint: 'empty.tip2Hint'
  },
  {
    icon: 'sparkles',
    text: 'empty.tip3',
    color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    hint: 'empty.tip3Hint'
  },
]
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
    <div
      v-for="tip in tips"
      :key="tip.text"
      class="group flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      <div :class="tip.color" class="flex items-center justify-center w-10 h-10 rounded-lg shrink-0">
        <!-- Search icon -->
        <svg v-if="tip.icon === 'search'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <!-- Tag icon -->
        <svg v-else-if="tip.icon === 'tag'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
        </svg>
        <!-- Sparkles icon -->
        <svg v-else-if="tip.icon === 'sparkles'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
        </svg>
      </div>
      <div class="text-left">
        <p class="text-sm font-medium text-gray-900 dark:text-stone-100">{{ t(tip.text) }}</p>
        <p class="text-xs text-gray-500 dark:text-stone-400">{{ t(tip.hint) }}</p>
      </div>
    </div>
  </div>
</template>
