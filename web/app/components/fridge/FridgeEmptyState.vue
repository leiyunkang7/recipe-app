<script setup lang="ts">
/**
 * FridgeEmptyState - 冰箱模式空状态组件
 *
 * 功能：
 * - 无食材时的引导空状态（让用户添加食材）
 * - 搜索无结果时的空状态（提示调整搜索）
 * - 装饰性动画元素
 * - 快捷操作建议
 */
const { t } = useI18n()

const props = defineProps<{
  hasIngredients: boolean
}>()

const emit = defineEmits<{
  addIngredient: []
}>()

// Decorative floating food items
const floatingItems = computed(() => {
  if (props.hasIngredients) {
    // No match state - show question marks and question marks
    return [
      { emoji: '🤔', x: '10%', y: '15%', delay: '0s', duration: '3s' },
      { emoji: '🔍', x: '85%', y: '20%', delay: '0.4s', duration: '2.5s' },
      { emoji: '🥄', x: '8%', y: '75%', delay: '0.2s', duration: '3.2s' },
      { emoji: '❓', x: '88%', y: '80%', delay: '0.6s', duration: '2.8s' },
    ]
  }
  // Empty state - show fridge-related items
  return [
    { emoji: '🥕', x: '8%', y: '15%', delay: '0s', duration: '3s' },
    { emoji: '🍅', x: '88%', y: '18%', delay: '0.3s', duration: '2.8s' },
    { emoji: '🥦', x: '6%', y: '70%', delay: '0.5s', duration: '3.5s' },
    { emoji: '🧅', x: '90%', y: '75%', delay: '0.2s', duration: '2.6s' },
  ]
})

const title = computed(() =>
  props.hasIngredients ? t('fridgeMode.noMatchTitle') : t('fridgeMode.emptyTitle')
)
const description = computed(() =>
  props.hasIngredients ? t('fridgeMode.noMatchDescription') : t('fridgeMode.emptyDescription')
)
const actionLabel = computed(() =>
  props.hasIngredients ? t('fridgeMode.adjustIngredients') : t('fridgeMode.addIngredient')
)
</script>

<template>
  <div class="flex flex-col items-center justify-center py-8 px-4 relative">
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

    <!-- Illustration -->
    <div class="mb-6 relative">
      <!-- Ambient glow -->
      <div class="absolute inset-0 bg-gradient-to-br from-orange-100/60 via-amber-50/40 to-orange-100/60 dark:from-orange-900/30 dark:via-amber-900/20 dark:to-orange-900/30 rounded-full blur-2xl scale-110"></div>

      <!-- Fridge illustration container -->
      <div class="relative w-24 h-24 mx-auto">
        <!-- Mini fridge SVG -->
        <svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Fridge body -->
          <rect x="20" y="10" width="60" height="80" rx="8" fill="currentColor" class="text-gray-100 dark:text-gray-700"/>
          <rect x="20" y="10" width="60" height="80" rx="8" stroke="currentColor" class="text-gray-300 dark:text-gray-500" stroke-width="2"/>

          <!-- Fridge door line -->
          <line x1="20" y1="35" x2="80" y2="35" stroke="currentColor" class="text-gray-300 dark:text-gray-500" stroke-width="2"/>

          <!-- Handle top -->
          <rect x="70" y="18" width="4" height="10" rx="2" fill="currentColor" class="text-gray-400 dark:text-gray-400"/>

          <!-- Handle bottom -->
          <rect x="70" y="45" width="4" height="14" rx="2" fill="currentColor" class="text-gray-400 dark:text-gray-400"/>

          <!-- Question mark / empty indicator -->
          <text
            x="50"
            y="30"
            text-anchor="middle"
            fill="currentColor"
            class="text-orange-400 dark:text-orange-500 text-lg font-bold"
          >?</text>

          <!-- Small food items in fridge -->
          <circle cx="35" cy="60" r="5" fill="currentColor" class="text-orange-300"/>
          <circle cx="50" cy="65" r="4" fill="currentColor" class="text-amber-300"/>
          <circle cx="62" cy="58" r="5" fill="currentColor" class="text-green-400"/>

          <!-- Glow effect -->
          <rect x="22" y="12" width="56" height="76" rx="6" fill="url(#fridgeGlow)" opacity="0.3"/>

          <defs>
            <radialGradient id="fridgeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#f97316" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#f97316" stop-opacity="0"/>
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>

    <!-- Content -->
    <div class="text-center mb-6">
      <h3 class="text-lg font-bold text-gray-900 dark:text-stone-100 mb-2">
        {{ title }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-stone-400 max-w-xs mx-auto">
        {{ description }}
      </p>
    </div>

    <!-- Action hint -->
    <button
      v-if="!hasIngredients"
      @click="emit('addIngredient')"
      class="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-all hover:scale-105 active:scale-95"
    >
      <span>➕</span>
      {{ actionLabel }}
    </button>

    <!-- Suggestion pills for no-match state -->
    <div v-if="hasIngredients" class="flex flex-wrap justify-center gap-2 mt-2">
      <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-stone-400 text-xs rounded-full">
        {{ t('fridgeMode.tryFewer') }}
      </span>
      <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-stone-400 text-xs rounded-full">
        {{ t('fridgeMode.removeOne') }}
      </span>
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
    transform: translateY(-8px) rotate(3deg);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
