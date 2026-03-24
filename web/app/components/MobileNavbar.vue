<script setup lang="ts">
/**
 * MobileNavbar - 移动端底部导航
 *
 * 特性：
 * - 只在移动端显示（md以下断点）
 * - 顶部导航栏含汉堡菜单 + 底部固定定位
 * - Spring 物理动画反馈
 * - 入场动画
 * - 暗色模式支持
 * - 键盘可访问性优化
 */

const { t, locale } = useI18n()
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

// 入场动画状态
const isEntered = ref(false)
onMounted(() => {
  const timer = setTimeout(() => {
    isEntered.value = true
  }, 100)
  onUnmounted(() => clearTimeout(timer))
})

// 导航标签
const tabs = computed(() => [
  {
    path: '/',
    icon: '🏠',
    activeIcon: '🏠',
    label: t('nav.home'),
    ariaLabel: t('nav.home')
  },
  {
    path: '/favorites',
    icon: '🤍',
    activeIcon: '❤️',
    label: t('favorites.title'),
    ariaLabel: t('favorites.title'),
    badge: favoriteIds.value.size
  },
])

// 汉堡菜单按钮键盘处理
const handleMenuKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleMenu()
  }
}
</script>

<template>
  <div class="md:hidden">
    <!-- 顶部导航栏 -->
    <MobileNavbarHeader
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
      @close="closeMenu"
    />
  </div>
</template>
