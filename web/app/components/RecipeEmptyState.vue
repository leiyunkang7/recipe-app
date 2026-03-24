<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const props = defineProps<{
  searchQuery: string
  selectedCategory: string
}>()

const emit = defineEmits<{
  clearSearch: []
  clearCategory: []
}>()

const hasFilters = computed(() => props.searchQuery || props.selectedCategory)

// Decorative food emojis for different states
const foodEmojis = ['🍳', '🥗', '🍝', '🥐', '🍲', '🥘', '🍜', '🥧']
// Use plain variable instead of computed - Math.random() is non-reactive
// and computed would cause hydration mismatches between SSR and client
const randomFood = foodEmojis[Math.floor(Math.random() * foodEmojis.length)]

// Example recipes for guidance
const exampleRecipes = [
  { emoji: '🍝', name: '番茄意面' },
  { emoji: '🍲', name: '红烧肉' },
  { emoji: '🥗', name: '凯撒沙拉' },
]
</script>

<template>
  <div class="text-center py-12 md:py-20 px-4 relative overflow-hidden">
    <!-- Background decorative elements -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-10 left-10 text-4xl opacity-20 animate-bounce" style="animation-duration: 3s;">
        🌟
      </div>
      <div class="absolute top-20 right-16 text-3xl opacity-20 animate-pulse">
        ✨
      </div>
      <div class="absolute bottom-20 left-1/4 text-2xl opacity-20" style="animation: float 4s ease-in-out infinite;">
        🥄
      </div>
      <div class="absolute bottom-10 right-1/4 text-3xl opacity-20 animate-bounce" style="animation-duration: 2.5s;">
        🍽️
      </div>
    </div>

    <!-- Enhanced SVG Illustration -->
    <div class="relative inline-block mb-8 animate-fade-in">
      <EmptyPlateIllustration />
    </div>

    <!-- Content based on state -->
    <template v-if="hasFilters">
      <!-- No results state -->
      <div class="mb-6 animate-fade-in">
        <!-- Search icon with decorative ring -->
        <div class="relative inline-block mb-4">
          <div class="absolute inset-0 bg-orange-100 dark:bg-orange-900/30 rounded-full scale-150 opacity-50 animate-ping"></div>
          <div class="relative inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/40 rounded-full">
            <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
        <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-2">{{ t('empty.noResults') }}</h3>
        <p class="text-gray-500 dark:text-stone-400 max-w-sm mx-auto mb-6">{{ t('empty.tryDifferent') }}</p>

        <!-- Helpful suggestions when no results -->
        <div class="flex flex-wrap justify-center gap-2 text-sm text-gray-400 dark:text-stone-500">
          <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">{{ t('search.clearSearch') }}</span>
          <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">{{ t('search.allCategories') }}</span>
        </div>
      </div>
    </template>
    <template v-else>
      <!-- Empty state - First time user -->
      <div class="mb-8 animate-fade-in">
        <!-- Random food emoji decoration -->
        <div class="mb-4">
          <span class="text-5xl">{{ randomFood }}</span>
        </div>

        <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-3">{{ t('empty.title') }}</h3>
        <p class="text-gray-500 dark:text-stone-400 max-w-md mx-auto mb-6">{{ t('empty.description') }}</p>

        <!-- Getting Started Steps -->
        <div class="max-w-lg mx-auto">
          <EmptyStateTips />
        </div>

        <!-- Example Recipes Preview -->
        <div class="max-w-sm mx-auto mb-8">
          <p class="text-xs text-gray-400 dark:text-stone-500 mb-3">{{ t('empty.exampleRecipes') }}</p>
          <div class="flex justify-center gap-4">
            <div
              v-for="recipe in exampleRecipes"
              :key="recipe.name"
              class="flex flex-col items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <span class="text-2xl">{{ recipe.emoji }}</span>
              <span class="text-xs text-gray-600 dark:text-stone-400">{{ recipe.name }}</span>
            </div>
          </div>
        </div>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <NuxtLink
            :to="localePath('/admin/recipes/new')"
            class="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-600/25"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ t('empty.addFirstRecipe') }}
          </NuxtLink>

          <!-- Secondary actions -->
          <EmptyStateQuickActions />
        </div>
      </div>
    </template>

    <!-- Clear Filters -->
    <div v-if="hasFilters" class="flex flex-wrap justify-center gap-3 mt-4 animate-fade-in">
      <button
        v-if="searchQuery"
        @click="emit('clearSearch')"
        class="flex items-center gap-2 px-5 py-2.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-all hover:scale-105"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        {{ t('search.clearSearch') }}
      </button>
      <button
        v-if="selectedCategory"
        @click="emit('clearCategory')"
        class="flex items-center gap-2 px-5 py-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-all hover:scale-105"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        {{ t('search.allCategories') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
