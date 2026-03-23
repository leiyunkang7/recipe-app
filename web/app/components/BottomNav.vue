<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const tabs = computed(() => [
  { path: '/', icon: '🏠', label: t('nav.home') },
  { path: '/admin', icon: '⚙️', label: t('nav.admin') },
])

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/' || route.path.startsWith('/recipes/')
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-gray-200 dark:border-stone-700 md:hidden z-50 safe-area-bottom">
    <div class="flex items-center justify-around h-14">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.path"
        :to="localePath(tab.path, locale)"
        :class="[
          'flex flex-col items-center justify-center w-full h-full transition-colors',
          isActive(tab.path) ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-stone-400'
        ]"
      >
        <span class="text-xl">{{ tab.icon }}</span>
        <span class="text-xs mt-0.5">{{ tab.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
