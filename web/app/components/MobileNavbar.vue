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
 */

// SSR safety: useI18n might not be ready during SSR
const i18n = useI18n()
// Provide a fallback t function for SSR
const t = (key: string, fallback?: string): string => {
  if (typeof i18n?.t === 'function') {
    try {
      return i18n.t(key, fallback ?? key)
    } catch {
      return fallback ?? key
    }
  }
  return fallback ?? key
}
const locale = i18n?.locale ?? ref('zh-CN')
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

// 导航标签 - 4个标签：首页、搜索、我的食谱、收藏
const tabs = computed(() => [
  {
    path: '/',
    icon: '🏠',
    activeIcon: '🏠',
    label: t('nav.home'),
    ariaLabel: t('nav.home')
  },
  {
    path: '/recipes',
    icon: '🔍',
    activeIcon: '🔍',
    label: t('nav.search'),
    ariaLabel: t('nav.search')
  },
  {
    path: '/my-recipes',
    icon: '📖',
    activeIcon: '📖',
    label: t('myRecipes.title'),
    ariaLabel: t('myRecipes.title'),
  },
  {
    path: '/favorites',
    icon: '🤍',
    activeIcon: '❤️',
    label: t('nav.favorites'),
    ariaLabel: t('nav.favorites'),
    badge: favoriteIds.value.length
  },
])

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
