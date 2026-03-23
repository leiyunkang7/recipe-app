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
    step: 1
  },
  {
    icon: 'camera',
    text: 'empty.step2',
    hint: 'empty.step2Hint',
    color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    accentColor: 'border-emerald-200 dark:border-emerald-800',
    step: 2
  },
  {
    icon: 'sparkles',
    text: 'empty.step3',
    hint: 'empty.step3Hint',
    color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    bgHover: 'hover:bg-violet-50 dark:hover:bg-violet-900/20',
    accentColor: 'border-violet-200 dark:border-violet-800',
    step: 3
  },
  {
    icon: 'search',
    text: 'empty.tipSearch',
    hint: 'empty.tipSearchHint',
    color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    accentColor: 'border-blue-200 dark:border-blue-800',
    step: null
  },
  {
    icon: 'category',
    text: 'empty.tipBrowse',
    hint: 'empty.tipBrowseHint',
    color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
    accentColor: 'border-amber-200 dark:border-amber-800',
    step: null
  }
]

// Show first 3 tips, but rotate which ones based on time of day
const hour = new Date().getHours()
const tipOffset = hour % (tips.length - 3)
const displayTips = computed(() => tips.slice(tipOffset, tipOffset + 3))
</script>

<template>
  <div class="mb-6">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-sm font-medium text-gray-500 dark:text-stone-400">{{ t('empty.gettingStarted') }}</span>
      <div class="flex-1 h-px bg-gradient-to-r from-gray-200 via-transparent to-transparent dark:from-gray-700"></div>
    </div>
    <div class="flex flex-col sm:flex-row items-stretch justify-center gap-3">
      <div
        v-for="(item, index) in displayTips"
        :key="item.icon + index"
        class="group relative flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default"
        :class="[item.bgHover, item.accentColor]"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <!-- Step number badge (for guided steps) -->
        <div v-if="item.step" class="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500 rounded-full flex items-center justify-center shadow-md">
          <span class="text-white dark:text-orange-900 text-xs font-bold">{{ item.step }}</span>
        </div>

        <!-- Icon badge -->
        <div class="relative shrink-0">
          <div :class="item.color" class="flex items-center justify-center w-10 h-10 rounded-lg transition-transform group-hover:scale-110">
            <!-- Edit icon -->
            <svg v-if="item.icon === 'edit'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            <!-- Camera icon -->
            <svg v-else-if="item.icon === 'camera'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <!-- Sparkles icon -->
            <svg v-else-if="item.icon === 'sparkles'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
            </svg>
            <!-- Search icon -->
            <svg v-else-if="item.icon === 'search'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <!-- Category icon -->
            <svg v-else-if="item.icon === 'category'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          </div>
        </div>
        <div class="text-left min-w-0 flex-1">
          <p class="text-sm font-semibold text-gray-900 dark:text-stone-100">{{ t(item.text) }}</p>
          <p class="text-xs text-gray-500 dark:text-stone-400 truncate">{{ t(item.hint) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
