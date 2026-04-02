<script setup lang="ts">
/**
 * DrawerPanel - 抽屉面板内容
 *
 * 组合 Header、NavList 和 Footer 子组件
 * 特性：
 * - 入场动画（头部、导航项、底部错开）
 * - 聚焦陷阱 (focus trap)
 * - ESC 键关闭
 * - 箭头键导航（roving tabindex）
 * - 暗色模式支持
 */

interface NavItem {
  path: string
  label: string
  icon: string
  badge?: number
}

interface Props {
  navItems: NavItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const route = useRoute()

// Refs for focus management
const headerRef = ref<{ focusMenuButton: () => void } | null>(null)
const navListRef = ref<{ focusFirstItem: () => void } | null>(null)

// 入场动画状态
const isContentVisible = ref(false)

// 关闭菜单
const closeMenu = () => {
  emit('close')
}

// 键盘导航 - 聚焦陷阱 (focus trap)
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      closeMenu()
      break
  }
}

// 延迟显示内容以实现入场动画
onMounted(() => {
  nextTick(() => {
    // 初始聚焦到第一个导航项
    navListRef.value?.focusFirstItem()
    // 短暂延迟后触发内容入场动画
    requestAnimationFrame(() => {
      setTimeout(() => {
        isContentVisible.value = true
      }, 50)
    })
  })
})

// 监听路由变化自动关闭
watch(() => route.path, () => {
  closeMenu()
})
</script>

<template>
  <div
    id="mobile-menu-drawer"
    class="fixed top-0 left-0 bottom-0 w-72 max-w-[80vw] sm:max-w-[85vw] bg-white dark:bg-stone-900 z-50 md:hidden shadow-2xl"
    role="dialog"
    aria-modal="true"
    :aria-label="t('nav.mobileMenu', '导航菜单')"
    @keydown="handleKeyDown"
  >
    <!-- 头部 -->
    <DrawerPanelHeader
      ref="headerRef"
      :is-content-visible="isContentVisible"
      @close="closeMenu"
    />

    <!-- 导航列表 -->
    <DrawerPanelNavList
      ref="navListRef"
      :nav-items="navItems"
      :is-content-visible="isContentVisible"
      @close="closeMenu"
    />

    <!-- 底部信息 -->
    <DrawerPanelFooter
      :is-content-visible="isContentVisible"
    />
  </div>
</template>
