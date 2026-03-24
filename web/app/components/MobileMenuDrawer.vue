<script setup lang="ts">
/**
 * MobileMenuDrawer - 移动端汉堡菜单抽屉
 *
 * 特性：
 * - 从左侧滑入动画
 * - 聚焦陷阱 (focus trap)
 * - ESC 键关闭
 * - 箭头键导航
 * - 暗色模式支持
 * - 减少动画偏好支持
 */

interface NavItem {
  path: string
  label: string
  icon: string
  badge?: number
}

interface Props {
  isOpen: boolean
  navItems: NavItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// 关闭菜单
const closeMenu = () => {
  emit('close')
}

// 点击遮罩层关闭
const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    closeMenu()
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <Transition name="backdrop">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
        aria-hidden="true"
        @click="handleBackdropClick"
      />
    </Transition>

    <!-- 抽屉 -->
    <Transition name="drawer">
      <DrawerPanel
        v-if="isOpen"
        :nav-items="navItems"
        @close="closeMenu"
      />
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 遮罩层动画 */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 200ms ease-out;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* 抽屉滑入动画 */
.drawer-enter-active {
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.drawer-leave-active {
  transition: transform 200ms ease-in;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(-100%);
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .backdrop-enter-active,
  .backdrop-leave-active,
  .drawer-enter-active,
  .drawer-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
