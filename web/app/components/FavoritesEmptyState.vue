<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const emit = defineEmits<{
  explore: []
}>()

// Floating decorative items
const floatingItems = [
  { emoji: '❤️', x: '5%', y: '20%', delay: '0s', duration: '2.5s' },
  { emoji: '⭐', x: '90%', y: '15%', delay: '0.3s', duration: '3s' },
  { emoji: '💫', x: '8%', y: '75%', delay: '0.6s', duration: '3.2s' },
  { emoji: '✨', x: '88%', y: '80%', delay: '0.2s', duration: '2.8s' },
]
</script>

<template>
  <div class="text-center py-12 md:py-16 px-4">
    <!-- Floating decorative items -->
    <div
      v-for="(item, index) in floatingItems"
      :key="index"
      class="absolute text-2xl pointer-events-none"
      :style="{
        left: item.x,
        top: item.y,
        animationDelay: item.delay,
        animationDuration: item.duration
      }"
      style="animation: float 3s ease-in-out infinite;"
    >
      {{ item.emoji }}
    </div>

    <!-- Heart Illustration -->
    <FavoritesHeartIllustration />

    <!-- Content -->
    <div class="mb-8">
      <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-3">
        {{ t('favorites.empty') }}
      </h3>
      <p class="text-gray-500 dark:text-stone-400 max-w-md mx-auto mb-8">
        {{ t('favorites.emptyDescription') }}
      </p>

      <!-- Tips -->
      <FavoritesTips />
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
@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-10px) rotate(5deg);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important
  }
}
</style>
