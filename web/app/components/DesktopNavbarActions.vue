<script setup lang="ts">
/**
 * DesktopNavbarActions - 桌面端导航右侧操作区
 */
import SettingsIcon from '~/components/icons/SettingsIcon.vue'
import NotificationBell from '~/components/NotificationBell.vue'

const { t, locale } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- 通知铃铛 -->
    <NotificationBell />

    <!-- 主题切换 -->
    <ThemeToggle />

    <!-- 语言切换 -->
    <LanguageSwitcher />

    <!-- 管理入口 -->
    <NuxtLink
      :to="localePath('/admin', locale)"
      class="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gray-900 dark:bg-stone-700 text-white dark:text-stone-100 rounded-lg hover:bg-gray-800 dark:hover:bg-stone-600 transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
      :aria-label="t('nav.admin')"
    >
      <SettingsIcon class="w-4 h-4" />
      <span class="hidden lg:inline">{{ t('nav.admin') }}</span>
    </NuxtLink>
  </div>
</template>
