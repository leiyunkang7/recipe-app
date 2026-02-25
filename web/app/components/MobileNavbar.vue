<script setup lang="ts">
/**
 * MobileNavbar - 移动端底部导航（优化版）
 * 
 * 优化点：
 * - 添加图标动画反馈
 * - 安全区域适配优化
 * - 触摸反馈增强
 * - 高对比度活跃状态
 */

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const tabs = computed(() => [
  { 
    path: '/', 
    icon: '🏠', 
    activeIcon: '🏠',
    label: t('nav.home'),
    ariaLabel: t('nav.homeAria', '首页')
  },
  // 管理入口已临时屏蔽
  // { 
  //   path: '/admin', 
  //   icon: '⚙️', 
  //   activeIcon: '⚙️',
  //   label: t('nav.admin'),
  //   ariaLabel: t('nav.adminAria', '管理')
  // },
])

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/' || route.path.startsWith('/recipes/')
  }
  return route.path.startsWith(path)
}

// 触摸反馈
const pressedTab = ref<string | null>(null)
const handleTouchStart = (path: string) => {
  pressedTab.value = path
}
const handleTouchEnd = () => {
  pressedTab.value = null
}
</script>

<template>
  <nav 
    class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 md:hidden z-50 mobile-safe-bottom"
    role="navigation"
    :aria-label="t('nav.bottomNavAria', '底部导航')"
  >
    <div class="flex items-center justify-around h-14">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.path"
        :to="localePath(tab.path, locale)"
        :class="[
          'relative flex flex-col items-center justify-center w-full h-full transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-inset',
          isActive(tab.path) 
            ? 'text-orange-600 scale-105' 
            : 'text-gray-400 hover:text-gray-600',
          pressedTab === tab.path ? 'scale-95' : ''
        ]"
        :aria-label="tab.ariaLabel"
        :aria-current="isActive(tab.path) ? 'page' : undefined"
        @touchstart.passive="handleTouchStart(tab.path)"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
      >
        <!-- 活跃指示器 -->
        <span
          v-if="isActive(tab.path)"
          class="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full"
          aria-hidden="true"
        ></span>
        
        <!-- 图标 -->
        <span 
          class="text-2xl transition-transform duration-200"
          :class="{ 'scale-110': isActive(tab.path) }"
        >
          {{ isActive(tab.path) ? tab.activeIcon : tab.icon }}
        </span>
        
        <!-- 标签 -->
        <span 
          class="text-xs mt-0.5 font-medium"
          :class="{ 'text-orange-700': isActive(tab.path) }"
        >
          {{ tab.label }}
        </span>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
/* 移动端安全区域适配 */
.mobile-safe-bottom {
  padding-bottom: max(env(safe-area-inset-bottom), 0px);
}

/* iOS底部横条适配 */
@supports (padding: max(0px)) {
  .mobile-safe-bottom {
    padding-bottom: max(env(safe-area-inset-bottom), 8px);
  }
}

/* 防止iOS双击缩放 */
@media (pointer: coarse) {
  a, button {
    touch-action: manipulation;
  }
}
</style>
