<script setup lang="ts">
// Enhanced empty plate illustration with delightful animations
// Note: This component uses Tailwind dark: variants which are controlled by
// the .dark class on <html> via useTheme() composable.
// No direct DOM manipulation needed - theme reactivity is handled by Vue's class bindings.

// Animated stars for extra sparkle
const stars = [
  { x: '15%', y: '10%', size: 'w-1.5 h-1.5', delay: '0s', duration: '2s' },
  { x: '85%', y: '15%', size: 'w-2 h-2', delay: '0.5s', duration: '2.5s' },
  { x: '10%', y: '85%', size: 'w-1 h-1', delay: '1s', duration: '1.8s' },
  { x: '90%', y: '80%', size: 'w-1.5 h-1.5', delay: '0.3s', duration: '2.2s' },
  { x: '50%', y: '5%', size: 'w-1 h-1', delay: '0.8s', duration: '2.8s' },
]
</script>

<template>
  <div class="relative">
    <!-- Animated sparkles background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        v-for="(star, i) in stars"
        :key="i"
        :class="[star.size, 'absolute rounded-full bg-amber-400 dark:bg-amber-300']"
        :style="{
          left: star.x,
          top: star.y,
          animationDelay: star.delay,
          animationDuration: star.duration
        }"
        style="animation: twinkle 2s ease-in-out infinite;"
      />
    </div>

    <!-- Floating food icons -->
    <FloatingFoodDecorations />

    <!-- Ambient glow layer -->
    <div class="absolute inset-0 bg-gradient-to-br from-amber-200/50 via-orange-200/30 to-amber-200/50 dark:from-amber-500/30 dark:via-orange-500/20 dark:to-amber-500/30 rounded-full blur-3xl scale-110 animate-pulse"></div>

    <!-- Warm glow behind plate -->
    <div class="absolute inset-0 bg-gradient-radial from-orange-300/20 via-transparent to-transparent dark:from-orange-400/10 rounded-full scale-75"></div>

    <!-- Main illustration container -->
    <PlateSvgIllustration />
  </div>
</template>

<style scoped>
@keyframes twinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.bg-gradient-radial {
  background: radial-gradient(circle, var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to));
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
  }
}
</style>
