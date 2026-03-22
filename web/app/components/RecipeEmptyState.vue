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
  <div class="text-center py-12 md:py-20 px-4">
    <!-- Enhanced SVG Illustration -->
    <div class="relative inline-block mb-8">
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
      <!-- Ambient glow -->
      <div class="absolute inset-0 bg-gradient-to-br from-amber-200/40 via-orange-200/20 to-amber-200/40 dark:from-amber-500/20 dark:via-orange-500/10 dark:to-amber-500/20 rounded-full blur-3xl -z-10 scale-125"></div>
    </div>
    
    <!-- Content based on state -->
    <template v-if="hasFilters">
      <!-- No results state -->
      <div class="mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-2">{{ t('empty.noResults') }}</h3>
        <p class="text-gray-500 dark:text-stone-400 max-w-sm mx-auto">{{ t('empty.tryDifferent') }}</p>
      </div>
    </template>
    <template v-else>
      <!-- Empty state - First time user -->
      <div class="mb-8">
        <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-3">{{ t('empty.title') }}</h3>
        <p class="text-gray-500 dark:text-stone-400 max-w-md mx-auto mb-6">{{ t('empty.description') }}</p>
        
        <!-- Getting Started Steps -->
        <div class="max-w-lg mx-auto">
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <div 
              v-for="(tip, index) in tips" 
              :key="tip.text"
              class="group flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div :class="tip.color" class="flex items-center justify-center w-10 h-10 rounded-lg shrink-0">
                <!-- Search icon -->
                <svg v-if="tip.icon === 'search'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <!-- Tag icon -->
                <svg v-else-if="tip.icon === 'tag'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
                <!-- Sparkles icon -->
                <svg v-else-if="tip.icon === 'sparkles'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                </svg>
              </div>
              <div class="text-left">
                <p class="text-sm font-medium text-gray-900 dark:text-stone-100">{{ t(tip.text) }}</p>
                <p class="text-xs text-gray-500 dark:text-stone-400">{{ t(tip.hint) }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
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
          <div class="flex items-center gap-2">
            <NuxtLink
              v-for="action in quickActions"
              :key="action.label"
              :to="localePath(action.path)"
              :class="action.color"
              class="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105"
            >
              <svg v-if="action.icon === 'upload'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              <svg v-else-if="action.icon === 'template'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
              </svg>
              {{ t(action.label) }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
    
    <!-- Clear Filters -->
    <div v-if="hasFilters" class="flex flex-wrap justify-center gap-3 mt-4">
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
