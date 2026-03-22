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

// Enhanced tips with better visual hierarchy
const tips = computed(() => [
  { 
    icon: 'search', 
    text: 'empty.tip1', 
    color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    hint: 'empty.tip1Hint'
  },
  { 
    icon: 'tag', 
    text: 'empty.tip2', 
    color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    hint: 'empty.tip2Hint'
  },
  { 
    icon: 'sparkles', 
    text: 'empty.tip3', 
    color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    hint: 'empty.tip3Hint'
  },
])

// Quick actions for getting started
const quickActions = [
  { 
    icon: 'upload', 
    label: 'empty.import', 
    path: '/admin/import',
    color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
  },
  { 
    icon: 'template', 
    label: 'empty.template', 
    path: '/admin/templates',
    color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300'
  },
]
</script>

<template>
  <div class="text-center py-16 md:py-24 px-4">
    <!-- SVG Illustration -->
    <div class="relative inline-block mb-8">
      <div class="relative">
        <!-- Plate with food SVG -->
        <svg class="w-32 h-32 mx-auto" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Plate -->
          <circle cx="60" cy="60" r="50" fill="currentColor" class="text-orange-100 dark:text-orange-900/30"/>
          <circle cx="60" cy="60" r="42" fill="currentColor" class="text-white dark:text-stone-800"/>
          <circle cx="60" cy="60" r="35" fill="currentColor" class="text-orange-50 dark:text-stone-700"/>
          <!-- Food items -->
          <circle cx="45" cy="50" r="12" fill="currentColor" class="text-green-500"/>
          <circle cx="70" cy="45" r="10" fill="currentColor" class="text-orange-400"/>
          <circle cx="60" cy="70" r="14" fill="currentColor" class="text-red-400"/>
          <circle cx="50" cy="72" r="6" fill="currentColor" class="text-yellow-400"/>
          <!-- Steam -->
          <path d="M50 30 Q55 25 50 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-orange-300 dark:text-orange-400 opacity-60" style="animation: float 2s ease-in-out infinite;"/>
          <path d="M60 28 Q65 22 60 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-orange-300 dark:text-orange-400 opacity-40" style="animation: float 2s ease-in-out infinite 0.5s;"/>
          <path d="M70 30 Q75 25 70 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-orange-300 dark:text-orange-400 opacity-60" style="animation: float 2s ease-in-out infinite 1s;"/>
        </svg>
      </div>
      <div class="absolute inset-0 bg-orange-200/30 dark:bg-orange-500/20 rounded-full blur-3xl -z-10 scale-150"></div>
    </div>
    
    <template v-if="searchQuery || selectedCategory">
      <h3 class="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-3">{{ t('empty.noResults') }}</h3>
      <p class="text-gray-500 dark:text-stone-400 max-w-sm mx-auto mb-6">{{ t('empty.tryDifferent') }}</p>
    </template>
    <template v-else>
      <h3 class="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-3">{{ t('empty.title') }}</h3>
      <p class="text-gray-500 dark:text-stone-400 max-w-md mx-auto mb-8">{{ t('empty.description') }}</p>
      
      <!-- Onboarding Tips with Icons -->
      <div class="flex flex-wrap justify-center gap-3 mb-8">
        <div 
          v-for="tip in tips" 
          :key="tip.text"
          :class="tip.color"
          class="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
        >
          <!-- Search icon -->
          <svg v-if="tip.icon === 'search'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <!-- Tag icon -->
          <svg v-else-if="tip.icon === 'tag'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
          </svg>
          <!-- Plus icon -->
          <svg v-else-if="tip.icon === 'plus'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>{{ t(tip.text) }}</span>
        </div>
      </div>
      
      <!-- CTA Button -->
      <NuxtLink
        :to="localePath('/admin/recipes/new')"
        class="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-full font-medium hover:bg-orange-700 transition-all hover:scale-105 active:scale-95"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        {{ t('admin.addRecipe') }}
      </NuxtLink>
    </template>
    
    <!-- Clear Filters -->
    <div class="flex flex-wrap justify-center gap-3 mt-6">
      <button 
        v-if="searchQuery"
        @click="emit('clearSearch')"
        class="px-5 py-2.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-all hover:scale-105"
      >
        {{ t('search.clearSearch') }}
        <svg class="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      <button 
        v-if="selectedCategory"
        @click="emit('clearCategory')"
        class="px-5 py-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-all hover:scale-105"
      >
        {{ t('search.allCategories') }}
        <svg class="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
