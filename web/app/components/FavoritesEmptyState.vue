<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const emit = defineEmits<{
  explore: []
}>()

const tips = [
  {
    icon: 'heart',
    text: 'favorites.tip1',
    hint: 'favorites.tip1Hint',
    color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
  },
  {
    icon: 'browse',
    text: 'favorites.tip2',
    hint: 'favorites.tip2Hint',
    color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
  },
  {
    icon: 'discover',
    text: 'favorites.tip3',
    hint: 'favorites.tip3Hint',
    color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
  }
]
</script>

<template>
  <div class="text-center py-12 md:py-16 px-4">
    <!-- Heart Illustration -->
    <div class="relative inline-block mb-8">
      <div class="relative">
        <svg class="w-40 h-40 mx-auto" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Background glow -->
          <circle cx="80" cy="80" r="70" fill="currentColor" class="text-rose-100 dark:text-rose-950/30"/>

          <!-- Decorative circles -->
          <circle cx="80" cy="80" r="60" fill="currentColor" class="text-white dark:text-gray-800"/>
          <circle cx="80" cy="80" r="55" fill="currentColor" class="text-rose-50 dark:text-rose-900/50"/>

          <!-- Heart shape (left side) -->
          <path
            d="M45 65 C45 55, 55 45, 65 45 C75 45, 80 55, 80 65 C80 55, 85 45, 95 45 C105 45, 115 55, 115 65 C115 85, 80 105, 80 105 C80 105, 45 85, 45 65Z"
            fill="currentColor"
            class="text-rose-400 dark:text-rose-500"
          />

          <!-- Inner heart highlight -->
          <path
            d="M55 60 C55 55, 62 52, 68 52 C72 52, 75 55, 78 58"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            class="text-rose-300 dark:text-rose-400"
            fill="none"
          />

          <!-- Sparkles -->
          <g class="opacity-70">
            <path d="M125 35 L127 40 L132 42 L127 44 L125 49 L123 44 L118 42 L123 40 Z" fill="currentColor" class="text-amber-400"/>
            <path d="M35 100 L37 104 L41 105 L37 106 L35 110 L33 106 L29 105 L33 104 Z" fill="currentColor" class="text-orange-400"/>
            <circle cx="130" cy="90" r="3" fill="currentColor" class="text-rose-300"/>
            <circle cx="30" cy="50" r="2.5" fill="currentColor" class="text-amber-300"/>
          </g>
        </svg>
      </div>
      <!-- Ambient glow -->
      <div class="absolute inset-0 bg-gradient-to-br from-rose-200/40 via-pink-200/20 to-rose-200/40 dark:from-rose-500/20 dark:via-pink-500/10 dark:to-rose-500/20 rounded-full blur-3xl -z-10 scale-125"></div>
    </div>

    <!-- Content -->
    <div class="mb-8">
      <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-3">
        {{ t('favorites.empty') }}
      </h3>
      <p class="text-gray-500 dark:text-stone-400 max-w-md mx-auto mb-8">
        {{ t('favorites.emptyDescription') }}
      </p>

      <!-- Tips -->
      <div class="max-w-lg mx-auto mb-8">
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div
            v-for="tip in tips"
            :key="tip.text"
            class="group flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 w-full sm:w-auto"
          >
            <div :class="tip.color" class="flex items-center justify-center w-10 h-10 rounded-lg shrink-0">
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
            </div>
            <div class="text-left">
              <p class="text-sm font-medium text-gray-900 dark:text-stone-100">{{ t(tip.text) }}</p>
              <p class="text-xs text-gray-500 dark:text-stone-400">{{ t(tip.hint) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Button -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
      <button
        @click="emit('explore')"
        class="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-600/25"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        {{ t('favorites.exploreRecipes') }}
      </button>

      <NuxtLink
        :to="localePath('/')"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-stone-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-105 active:scale-95"
      >
        <span>🍳</span>
        {{ t('nav.home') }}
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important
  }
}
</style>
