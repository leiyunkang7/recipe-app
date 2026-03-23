<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { locale } = useI18n()

const currentYear = new Date().getFullYear()
</script>

<template>
  <!-- 移动端底部导航 -->
  <MobileNavbar />

  <!-- 页面底部内容 -->
  <footer class="pb-20 md:pb-8 bg-white dark:bg-stone-900 border-t border-gray-200 dark:border-stone-700">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- 桌面端底部导航 -->
      <div class="hidden md:flex items-center justify-between">
        <!-- 左侧: 版权信息 -->
        <div class="text-sm text-gray-500 dark:text-stone-400">
          <span>© {{ currentYear }} {{ t('app.title') }}. All rights reserved.</span>
        </div>

        <!-- 右侧: 链接 -->
        <nav class="flex items-center gap-6 text-sm">
          <NuxtLink
            :to="localePath('/', locale)"
            class="text-gray-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            {{ t('nav.home') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/favorites', locale)"
            class="text-gray-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            {{ t('favorites.title') }}
          </NuxtLink>
        </nav>
      </div>

      <!-- 移动端底部信息 -->
      <div class="md:hidden text-center text-xs text-gray-400 dark:text-stone-500 mt-4">
        <p>© {{ currentYear }} {{ t('app.title') }}</p>
      </div>
    </div>
  </footer>
</template>
