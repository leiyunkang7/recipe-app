<script setup lang="ts">
/**
 * LogoSection - Logo 和标题区域
 */
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath('/', 'zh')"
    class="flex items-center gap-2 text-xl font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-lg"
    :aria-label="t('app.title')"
  >
    <span class="text-2xl">🍳</span>
    <span class="hidden sm:inline">{{ t('app.title') }}</span>
  </NuxtLink>
</template>
