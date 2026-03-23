<script setup lang="ts">
interface Props {
  recipeId: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showLabel: false,
})

const { isFavorite, toggleFavorite } = useFavorites()
const { t } = useI18n()

const isAnimating = ref(false)

const handleClick = async (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  
  isAnimating.value = true
  await toggleFavorite(props.recipeId)
  
  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

const sizeClasses = {
  sm: 'min-w-[44px] min-h-[44px] w-8 h-8',
  md: 'min-w-[44px] min-h-[44px] w-10 h-10',
  lg: 'min-w-[44px] min-h-[44px] w-12 h-12',
}

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}
</script>

<template>
  <button
    @click="handleClick"
    :class="[
      'favorite-btn flex items-center justify-center rounded-full transition-all duration-300',
      sizeClasses[size],
      isFavorite(recipeId) 
        ? 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40' 
        : 'bg-white/90 dark:bg-stone-800/90 text-gray-400 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-stone-800'
    ]"
    :title="isFavorite(recipeId) ? t('favorites.remove') : t('favorites.add')"
  >
    <svg
      :class="['transition-all duration-300', iconSizes[size], isAnimating ? 'scale-125' : '']"
      :fill="isFavorite(recipeId) ? 'currentColor' : 'none'"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
    <span v-if="showLabel" class="ml-2 text-sm font-medium">
      {{ isFavorite(recipeId) ? t('favorites.remove') : t('favorites.add') }}
    </span>
  </button>
</template>
