<script setup lang="ts">
// Friendly illustration for "no search results" state
// Features a magnifying glass with a confused/disappointed expression
</script>

<template>
  <div class="relative z-10 mx-auto w-40 h-40">
    <!-- Soft background glow -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-purple-100/50 dark:from-blue-900/30 dark:via-transparent dark:to-purple-900/30 rounded-full blur-2xl scale-110 animate-pulse"></div>

    <!-- Main magnifying glass SVG -->
    <svg class="w-full h-full relative" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background circle -->
      <circle cx="75" cy="75" r="55" fill="currentColor" class="text-gray-50 dark:text-gray-800/60"/>

      <!-- Magnifying glass outer ring with gradient -->
      <circle cx="68" cy="68" r="32" stroke="currentColor" stroke-width="8" class="text-blue-300 dark:text-blue-500/60"/>
      <circle cx="68" cy="68" r="28" stroke="currentColor" stroke-width="2" class="text-blue-200 dark:text-blue-400/40"/>

      <!-- Handle -->
      <rect x="90" y="90" width="10" height="35" rx="5" transform="rotate(45 90 90)" fill="currentColor" class="text-blue-300 dark:text-blue-500/60"/>
      <rect x="92" y="92" width="6" height="30" rx="3" transform="rotate(45 92 92)" fill="currentColor" class="text-blue-200 dark:text-blue-400/40"/>

      <!-- Confused face inside glass -->
      <g class="text-gray-400 dark:text-gray-500">
        <!-- Eyes -->
        <circle cx="58" cy="62" r="4" fill="currentColor"/>
        <circle cx="78" cy="62" r="4" fill="currentColor"/>
        <!-- Raised eyebrow look -->
        <path d="M52 54 Q58 50 64 54" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M72 54 Q78 50 84 54" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Uncertain mouth -->
        <path d="M60 80 Q68 76 76 80" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>

      <!-- Question mark above -->
      <text x="68" y="45" text-anchor="middle" fill="currentColor" class="text-blue-400 dark:text-blue-300 text-lg font-bold">?</text>

      <!-- Sparkles around -->
      <g class="text-amber-400">
        <path d="M120 40 L122 44 L126 46 L122 48 L120 52 L118 48 L114 46 L118 44 Z">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
        </path>
      </g>
      <g class="text-orange-400">
        <path d="M35 35 L37 38 L40 39 L37 40 L35 43 L33 40 L30 39 L33 38 Z">
          <animate attributeName="opacity" values="1;0.4;1" dur="2.3s" repeatCount="indefinite"/>
        </path>
      </g>
      <g class="text-blue-400">
        <path d="M130 70 L131 72 L133 73 L131 74 L130 76 L129 74 L127 73 L129 72 Z">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite"/>
        </path>
      </g>

      <!-- Small floating elements -->
      <circle cx="40" cy="100" r="3" fill="currentColor" class="text-blue-200 dark:text-blue-400/50">
        <animate attributeName="cy" values="100;96;100" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="125" cy="55" r="2" fill="currentColor" class="text-purple-200 dark:text-purple-400/50">
        <animate attributeName="cy" values="55;51;55" dur="2.5s" repeatCount="indefinite"/>
      </circle>
    </svg>

    <!-- Floating decorations -->
    <div class="absolute -top-2 -right-2 text-xl animate-bounce" style="animation-duration: 2.5s;">🍳</div>
    <div class="absolute -bottom-1 -left-3 text-lg animate-pulse">🥗</div>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
  }
}
</style>
