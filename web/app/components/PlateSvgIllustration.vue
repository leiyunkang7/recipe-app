<script setup lang="ts">
// SVG plate illustration with fork, knife, and question mark
</script>

<template>
  <div class="relative z-10 mx-auto w-48 h-48">
    <!-- Decorative ring -->
    <div class="absolute inset-0 rounded-full border-2 border-dashed border-amber-200/50 dark:border-amber-700/30 animate-spin" style="animation-duration: 20s;"></div>

    <!-- Inner glow ring -->
    <div class="absolute inset-2 rounded-full bg-gradient-to-br from-orange-100/30 to-amber-100/30 dark:from-orange-900/20 dark:to-amber-900/20 animate-pulse"></div>

    <!-- Main plate SVG -->
    <svg class="w-full h-full relative" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background glow -->
      <circle cx="80" cy="80" r="70" fill="currentColor" class="text-amber-50 dark:text-amber-950/40"/>

      <!-- Plate outer shadow -->
      <circle cx="80" cy="88" r="55" fill="currentColor" class="text-gray-200/60 dark:text-gray-700/40"/>

      <!-- Plate stack layers for depth -->
      <circle cx="80" cy="84" r="54" fill="currentColor" class="text-gray-100 dark:text-gray-700"/>
      <circle cx="80" cy="84" r="48" fill="currentColor" class="text-white dark:text-gray-800"/>
      <circle cx="80" cy="84" r="42" fill="currentColor" class="text-amber-50/80 dark:text-gray-600/80"/>

      <!-- Plate inner decorative ring - dashed -->
      <circle cx="80" cy="84" r="35" fill="none" stroke="currentColor" class="text-amber-200 dark:text-amber-800/60" stroke-width="1.5" stroke-dasharray="6 4">
        <animateTransform attributeName="transform" type="rotate" from="0 80 84" to="360 80 84" dur="30s" repeatCount="indefinite"/>
      </circle>

      <!-- Fork (left) -->
      <g class="text-gray-400 dark:text-gray-500">
        <rect x="28" y="30" width="3.5" height="42" rx="1.75">
          <animate attributeName="y" values="30;28;30" dur="4s" repeatCount="indefinite"/>
        </rect>
        <rect x="23" y="30" width="3.5" height="42" rx="1.75">
          <animate attributeName="y" values="30;28;30" dur="4s" repeatCount="indefinite"/>
        </rect>
        <rect x="33" y="30" width="3.5" height="42" rx="1.75">
          <animate attributeName="y" values="30;28;30" dur="4s" repeatCount="indefinite"/>
        </rect>
        <rect x="28" y="68" width="8.5" height="22" rx="2.5">
          <animate attributeName="y" values="68;66;68" dur="4s" repeatCount="indefinite"/>
        </rect>
      </g>

      <!-- Knife (right) -->
      <g class="text-gray-400 dark:text-gray-500">
        <rect x="126" y="28" width="5" height="52" rx="2.5">
          <animate attributeName="y" values="28;26;28" dur="4s" repeatCount="indefinite"/>
        </rect>
        <path d="M128.5 80 L128.5 98 Q128.5 105 140 105 L140 80 Z">
          <animate attributeName="d" values="M128.5 80 L128.5 98 Q128.5 105 140 105 L140 80 Z;M128.5 78 L128.5 96 Q128.5 103 140 103 L140 78 Z;M128.5 80 L128.5 98 Q128.5 105 140 105 L140 80 Z" dur="4s" repeatCount="indefinite"/>
        </path>
      </g>

      <!-- Central question mark with soft glow -->
      <g>
        <circle cx="80" cy="82" r="14" fill="currentColor" class="text-orange-100/70 dark:text-orange-900/40">
          <animate attributeName="r" values="14;15;14" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="80" cy="82" r="14" fill="currentColor" class="text-orange-200/50 dark:text-orange-800/30">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x="80" y="89" text-anchor="middle" fill="currentColor" class="text-orange-500 dark:text-orange-400 text-xl font-bold">?</text>
      </g>

      <!-- Animated sparkles - top right -->
      <g class="text-amber-400">
        <path d="M120 28 L122 33 L127 35 L122 37 L120 42 L118 37 L113 35 L118 33 Z">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="2s" repeatCount="indefinite" additive="sum"/>
        </path>
      </g>

      <!-- Animated sparkles - bottom left -->
      <g class="text-orange-400">
        <path d="M38 115 L40 119 L44 120 L40 121 L38 125 L36 121 L32 120 L36 119 Z">
          <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite"/>
        </path>
      </g>

      <!-- Sparkles - top left small -->
      <g class="text-amber-300">
        <path d="M35 40 L36 43 L39 44 L36 45 L35 48 L34 45 L31 44 L34 43 Z">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite"/>
        </path>
      </g>

      <!-- Sparkles - right side -->
      <g class="text-orange-300">
        <path d="M125 65 L127 69 L131 70 L127 71 L125 75 L123 71 L119 70 L123 69 Z">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2.2s" repeatCount="indefinite"/>
        </path>
      </g>

      <!-- Floating dots with bounce animation -->
      <circle cx="60" cy="52" r="4" fill="currentColor" class="text-amber-300">
        <animate attributeName="cy" values="52;48;52" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="100" cy="56" r="3" fill="currentColor" class="text-orange-300">
        <animate attributeName="cy" values="56;52;56" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="75" cy="48" r="2.5" fill="currentColor" class="text-amber-400">
        <animate attributeName="cy" values="48;44;48" dur="2.8s" repeatCount="indefinite"/>
      </circle>
    </svg>
  </div>
</template>
