<script setup lang="ts">
const props = defineProps<{
  tags: string[]
  isMobile?: boolean
}>()

const { t } = useI18n()

// Compute wrapper classes based on mobile/desktop to avoid template duplication
const wrapperClasses = computed(() => {
  const base = 'bg-white dark:bg-stone-800'
  const mobileClasses = 'rounded-2xl shadow-sm p-4'
  const desktopClasses = 'rounded-xl shadow-md dark:shadow-stone-900/30 p-6'
  return `${base} ${props.isMobile ? mobileClasses : desktopClasses}`
})

const headingClasses = computed(() => {
  const base = 'font-bold text-gray-900 dark:text-stone-100 flex items-center gap-2'
  const mobileClasses = 'text-lg mb-3'
  const desktopClasses = 'text-2xl mb-4'
  return `${base} ${props.isMobile ? mobileClasses : desktopClasses}`
})

const tagClasses = computed(() => {
  const base = 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium'
  const mobileClasses = 'px-3 py-1.5'
  const desktopClasses = 'px-3 py-2'
  return `${base} ${props.isMobile ? mobileClasses : desktopClasses}`
})
</script>

<template>
  <div :class="wrapperClasses">
    <h2 :class="headingClasses">
      🏷️ {{ t('recipe.tags') }}
    </h2>
    <div class="flex flex-wrap gap-2">
      <span
        v-for="tag in tags"
        :key="tag"
        :class="tagClasses"
      >
        {{ tag }}
      </span>
    </div>
  </div>
</template>
