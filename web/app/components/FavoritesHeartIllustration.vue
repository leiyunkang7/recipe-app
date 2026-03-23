<script setup lang="ts">
// Heart illustration with beat animation for favorites empty state
</script>

<template>
  <!-- Heart Illustration -->
  <div class="relative inline-block mb-8">
    <div class="relative">
      <svg class="w-44 h-44 mx-auto" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Background glow -->
        <circle cx="80" cy="80" r="70" fill="currentColor" class="text-rose-100 dark:text-rose-950/40"/>

        <!-- Decorative circles with pulse -->
        <circle cx="80" cy="80" r="62" fill="currentColor" class="text-white dark:text-gray-800">
          <animate attributeName="r" values="62;64;62" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="80" cy="80" r="56" fill="currentColor" class="text-rose-50 dark:text-rose-900/50"/>

        <!-- Heart shape with beat animation -->
        <path
          d="M45 65 C45 55, 55 45, 65 45 C75 45, 80 55, 80 65 C80 55, 85 45, 95 45 C105 45, 115 55, 115 65 C115 85, 80 105, 80 105 C80 105, 45 85, 45 65Z"
          fill="currentColor"
          class="text-rose-400 dark:text-rose-500"
        >
          <animateTransform attributeName="transform" type="scale" values="1;1.05;1" dur="1.5s" repeatCount="indefinite" additive="sum"/>
        </path>

        <!-- Inner heart highlight -->
        <path
          d="M55 60 C55 55, 62 52, 68 52 C72 52, 75 55, 78 58"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          class="text-rose-300 dark:text-rose-400"
          fill="none"
        />

        <!-- Animated sparkles -->
        <g class="opacity-70">
          <path d="M125 35 L127 40 L132 42 L127 44 L125 49 L123 44 L118 42 L123 40 Z" fill="currentColor" class="text-amber-400">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
          </path>
          <path d="M35 100 L37 104 L41 105 L37 106 L35 110 L33 106 L29 105 L33 104 Z" fill="currentColor" class="text-orange-400">
            <animate attributeName="opacity" values="1;0.4;1" dur="2.5s" repeatCount="indefinite"/>
          </path>
          <circle cx="130" cy="90" r="3" fill="currentColor" class="text-rose-300">
            <animate attributeName="cy" values="90;86;90" dur="2.8s" repeatCount="indefinite"/>
          </circle>
          <circle cx="30" cy="50" r="2.5" fill="currentColor" class="text-amber-300">
            <animate attributeName="cy" values="50;46;50" dur="3s" repeatCount="indefinite"/>
          </circle>
        </g>
      </svg>
    </div>
    <!-- Ambient glow -->
    <div class="absolute inset-0 bg-gradient-to-br from-rose-200/50 via-pink-200/30 to-rose-200/50 dark:from-rose-500/30 dark:via-pink-500/20 dark:to-rose-500/30 rounded-full blur-3xl -z-10 scale-125 animate-pulse"></div>
  </div>
</template>
