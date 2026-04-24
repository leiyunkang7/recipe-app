<script setup lang="ts">
/**
 * MobileNavbar - 移动端底部导航
 *
 * 特性：
 * - 只在移动端显示（md以下断点）
 * - 顶部导航栏含汉堡菜单 + 底部固定定位
 * - Spring 物理动画反馈
 * - 入场动画（使用 useEnterAnimation composable）
 * - 暗色模式支持
 * - 键盘可访问性优化
 *
 * 优化点：
 * - 使用 SVG icon 组件替代 emoji，确保跨平台一致性
 * - SVG 图标可响应 CSS 颜色变化，支持 active 状态变色
 * - 与项目其他组件（DesktopNavbar 等）保持统一的 icon 风格
 */

import HomeIcon from '~/components/icons/HomeIcon.vue'
import SearchIcon from '~/components/icons/SearchIcon.vue'
import BookIcon from '~/components/icons/BookIcon.vue'
import HeartIcon from '~/components/icons/HeartIcon.vue'

// SSR safety: useI18n is safe to use directly and provides a stable t function
const { t } = useI18n()
const { favoriteIds } = useFavorites()

// 汉堡菜单状态
const isMenuOpen = ref(false)

// 切换菜单
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

// 入场动画 - 使用 composable 统一管理
const { isEntered } = useEnterAnimation({ delay: 100 })

// Navigation tabs — label doubles as ariaLabel (same i18n key, no duplicate calls)
const tabs = computed(() => {
  const favCount = favoriteIds.value.size
  return [
    { path: '/', icon: HomeIcon, activeIcon: HomeIcon, label: t('nav.home'), ariaLabel: t('nav.home') },
    { path: '/recipes', icon: SearchIcon, activeIcon: SearchIcon, label: t('nav.search'), ariaLabel: t('nav.search') },
    { path: '/my-recipes', icon: BookIcon, activeIcon: BookIcon, label: t('myRecipes.title'), ariaLabel: t('myRecipes.title') },
    { path: '/favorites', icon: HeartIcon, activeIcon: HeartIcon, label: t('nav.favorites'), ariaLabel: t('nav.favorites'), badge: favCount },
  ]
})

// 汉堡菜单按钮键盘处理
const handleMenuKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleMenu()
  }
}

// 抽屉关闭时返回焦点到汉堡菜单按钮
const headerRef = ref<{ focusMenuButton: () => void } | null>(null)
const handleDrawerClose = () => {
  isMenuOpen.value = false
  // 抽屉关闭后将焦点返回到汉堡菜单按钮
  nextTick(() => {
    headerRef.value?.focusMenuButton()
  })
}
</script>

<template>
  <div class="md:hidden">
    <!-- 顶部导航栏 -->
    <MobileNavbarHeader
      ref="headerRef"
      :is-menu-open="isMenuOpen"
      :is-entered="isEntered"
      @toggle-menu="toggleMenu"
      @menu-keydown="handleMenuKeyDown"
    />

    <!-- 底部导航栏 -->
    <MobileBottomNav
      :tabs="tabs"
      :is-entered="isEntered"
    />

    <!-- 汉堡菜单抽屉 -->
    <MobileMenuDrawer
      :is-open="isMenuOpen"
      :nav-items="tabs"
      @close="handleDrawerClose"
    />
  </div>
</template>
