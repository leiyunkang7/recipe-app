<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

defineProps<{
  isFavorite: boolean
}>()

const emit = defineEmits<{
  toggleFavorite: []
}>()
</script>

<template>
  <!-- Mobile Header -->
  <header class="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-stone-800/95 backdrop-blur-md shadow-sm">
    <div class="flex items-center justify-between px-4 py-3">
      <NuxtLink
        :to="localePath('/', locale)"
        class="inline-flex items-center gap-1.5 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors text-sm font-medium"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        {{ t('common.back') }}
      </NuxtLink>
      
      <div class="flex items-center gap-2">
        <button 
          @click="emit('toggleFavorite')"
          class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors active:scale-95 touch-manipulation"
          :aria-label="isFavorite ? '取消收藏' : '收藏'"
        >
          <span class="text-xl transition-transform" :class="isFavorite ? 'scale-110' : ''">{{ isFavorite ? '❤️' : '🤍' }}</span>
        </button>
        <LanguageSwitcher />
      </div>
    </div>
  </header>

  <!-- Desktop Header -->
  <header class="hidden lg:block bg-white dark:bg-stone-800 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <NuxtLink
          :to="localePath('/', locale)"
          class="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
        >
          ← {{ t('common.back') }}
        </NuxtLink>
        <LanguageSwitcher />
      </div>
    </div>
  </header>
</template>
