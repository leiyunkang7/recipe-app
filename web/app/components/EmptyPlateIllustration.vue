<script setup lang="ts">
// Empty plate illustration component
</script>

<template>
  <div class="relative">
    <!-- Main illustration: Empty plate with utensils -->
    <svg class="w-40 h-40 mx-auto" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background glow -->
      <circle cx="70" cy="70" r="60" fill="currentColor" class="text-amber-50 dark:text-amber-950/30"/>

      <!-- Plate outer -->
      <circle cx="70" cy="75" r="52" fill="currentColor" class="text-gray-100 dark:text-gray-700"/>
      <!-- Plate inner -->
      <circle cx="70" cy="75" r="45" fill="currentColor" class="text-white dark:text-gray-800"/>
      <!-- Plate rim -->
      <circle cx="70" cy="75" r="38" fill="currentColor" class="text-amber-50 dark:text-gray-600"/>

      <!-- Fork (left) -->
      <rect x="22" y="30" width="3" height="35" rx="1.5" fill="currentColor" class="text-gray-400 dark:text-gray-500"/>
      <rect x="18" y="30" width="3" height="35" rx="1.5" fill="currentColor" class="text-gray-400 dark:text-gray-500"/>
      <rect x="26" y="30" width="3" height="35" rx="1.5" fill="currentColor" class="text-gray-400 dark:text-gray-500"/>
      <rect x="22" y="62" width="7" height="18" rx="2" fill="currentColor" class="text-gray-400 dark:text-gray-500"/>

      <!-- Knife (right) -->
      <rect x="115" y="28" width="4" height="45" rx="2" fill="currentColor" class="text-gray-400 dark:text-gray-500"/>
      <path d="M117 73 L117 90 Q117 95 127 95 L127 73 Z" fill="currentColor" class="text-gray-400 dark:text-gray-500"/>

      <!-- Empty state indicator - subtle question mark or sparkles -->
      <g class="opacity-60">
        <circle cx="70" cy="50" r="4" fill="currentColor" class="text-amber-400"/>
        <circle cx="55" cy="65" r="3" fill="currentColor" class="text-orange-300"/>
        <circle cx="85" cy="65" r="3" fill="currentColor" class="text-orange-300"/>
        <circle cx="70" cy="80" r="2.5" fill="currentColor" class="text-amber-400"/>
      </g>

      <!-- Decorative sparkles -->
      <g class="opacity-70">
        <path d="M105 25 L107 30 L112 32 L107 34 L105 39 L103 34 L98 32 L103 30 Z" fill="currentColor" class="text-amber-400"/>
        <path d="M35 105 L37 109 L41 110 L37 111 L35 115 L33 111 L29 110 L33 109 Z" fill="currentColor" class="text-orange-400"/>
      </g>
    </svg>
  </div>
</template>
