<script setup lang="ts">
// Floating food decorations around the plate illustration

const floatingItems = [
  { emoji: '🍳', x: '8%', y: '12%', delay: '0s', duration: '3s', size: 'text-xl' },
  { emoji: '🥗', x: '88%', y: '18%', delay: '0.5s', duration: '3.5s', size: 'text-lg' },
  { emoji: '🍝', x: '3%', y: '72%', delay: '1s', duration: '4s', size: 'text-xl' },
  { emoji: '🥐', x: '92%', y: '78%', delay: '0.3s', duration: '3.2s', size: 'text-lg' },
  { emoji: '🍲', x: '12%', y: '88%', delay: '0.8s', duration: '3.8s', size: 'text-xl' },
  { emoji: '🥗', x: '82%', y: '8%', delay: '0.2s', duration: '3.1s', size: 'text-base' },
  { emoji: '🥘', x: '5%', y: '45%', delay: '1.2s', duration: '4.2s', size: 'text-lg' },
  { emoji: '🍜', x: '90%', y: '50%', delay: '0.7s', duration: '3.6s', size: 'text-lg' },
]

const sparkles = [
  { cx: '12%', cy: '30%', delay: '0s', dur: '2s', color: 'text-amber-400' },
  { cx: '88%', cy: '35%', delay: '0.3s', dur: '2.5s', color: 'text-orange-400' },
  { cx: '15%', cy: '60%', delay: '0.6s', dur: '1.8s', color: 'text-amber-300' },
  { cx: '85%', cy: '65%', delay: '0.9s', dur: '2.2s', color: 'text-orange-300' },
]

// Light mode food illustrations for variety
const foodIllustrations = [
  { emoji: '🥄', x: '15%', y: '25%', size: 'text-sm', delay: '0s', duration: '3.5s' },
  { emoji: '🍽️', x: '85%', y: '30%', size: 'text-sm', delay: '0.4s', duration: '3s' },
  { emoji: '👨‍🍳', x: '10%', y: '60%', size: 'text-xs', delay: '0.8s', duration: '4s' },
  { emoji: '📝', x: '88%', y: '65%', size: 'text-xs', delay: '0.2s', duration: '3.2s' },
]
</script>

<template>
  <!-- Floating food icons -->
  <div
    v-for="(item, index) in floatingItems"
    :key="index"
    class="absolute pointer-events-none transition-transform hover:scale-125"
    :class="item.size"
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

  <!-- Sparkle effects -->
  <div
    v-for="(sparkle, index) in sparkles"
    :key="'sparkle-' + index"
    class="absolute w-2 h-2 rounded-full"
    :class="sparkle.color"
    :style="{
      left: sparkle.cx,
      top: sparkle.cy,
      animationDelay: sparkle.delay,
      animationDuration: sparkle.dur
    }"
    style="animation: sparkle-pulse 2s ease-in-out infinite;"
  />

  <!-- Additional floating elements around the plate -->
  <div
    v-for="(item, index) in foodIllustrations"
    :key="'food-' + index"
    class="absolute pointer-events-none transition-all duration-300"
    :class="item.size"
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

@keyframes sparkle-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
  }
}
</style>
