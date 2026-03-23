<script setup lang="ts">
// Enhanced empty plate illustration with delightful animations

const isDark = computed(() => {
  if (import.meta.server) return false
  return document.documentElement.classList.contains('dark')
})
</script>

<template>
  <div class="relative">
    <!-- Floating food icons -->
    <FloatingFoodDecorations />

    <!-- Ambient glow layer -->
    <div class="absolute inset-0 bg-gradient-to-br from-amber-200/50 via-orange-200/30 to-amber-200/50 dark:from-amber-500/30 dark:via-orange-500/20 dark:to-amber-500/30 rounded-full blur-3xl scale-110 animate-pulse"></div>

    <!-- Main illustration container -->
    <PlateSvgIllustration />
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
  }
}
</style>
