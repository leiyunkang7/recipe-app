<script setup lang="ts">
/**
 * BottomNav - 移动端底部导航栏组件
 *
 * 功能：
 * - 固定在页面底部显示
 * - 支持首页、管理后台两个导航项
 * - 自动高亮当前活动路由
 * - 支持安全区域适配 (safe-area-inset-bottom)
 *
 * 使用方式：
 * <BottomNav />
 */
import HomeIcon from '~/components/icons/HomeIcon.vue'
import HeartIcon from '~/components/icons/HeartIcon.vue'
import SettingsIcon from '~/components/icons/SettingsIcon.vue'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const { favoriteIds } = useFavorites()

const tabs = computed(() => [
  { path: '/', icon: HomeIcon, label: t('nav.home') },
  { path: '/favorites', icon: HeartIcon, label: t('favorites.title'), badge: favoriteIds.value.size },
  { path: '/admin', icon: SettingsIcon, label: t('nav.admin') },
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
          'flex flex-col items-center justify-center w-full h-full transition-colors relative',
          isActive(tab.path) ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-stone-400'
        ]"
        :aria-label="tab.label"
      >
        <component :is="tab.icon" class="w-6 h-6" />
        <span class="text-xs mt-0.5">{{ tab.label }}</span>
        <span
          v-if="tab.badge && tab.badge > 0"
          class="absolute top-0 right-1/2 translate-x-3 -translate-y-0.5 min-w-[18px] h-[18px] px-1 text-xs font-bold bg-red-500 text-white rounded-full flex items-center justify-center"
        >
          {{ tab.badge > 99 ? '99+' : tab.badge }}
        </span>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
