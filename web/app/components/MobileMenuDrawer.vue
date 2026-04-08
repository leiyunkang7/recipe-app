<script setup lang="ts">
/**
 * MobileMenuDrawer - 移动端汉堡菜单抽屉
 *
 * 特性：
 * - 从左侧滑入动画（带弹性缓动）
 * - 聚焦陷阱 (focus trap)
 * - ESC 键关闭
 * - 箭头键导航
 * - 暗色模式支持
 * - 减少动画偏好支持
 * - 触摸滑动手势支持（滑出关闭）
 */

import { useSwipeGesture } from '~/composables/useSwipeGesture'

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

// 滑动手势状态
const drawerRef = ref<HTMLElement | null>(null)
const drawerTranslateX = ref(-100)
const isDragging = ref(false)

// 计算实际的 transform 字符串
const drawerTransform = computed(() => `translateX(${drawerTranslateX}%)`)

// 使用增强的 swipe 手势 composable
useSwipeGesture(
  drawerRef,
  {
    onSwipeStart: () => {
      isDragging.value = true
    },
    onSwipeMove: (state) => {
      if (state.direction.primary === 'right') {
        // 从左向右滑动，显示抽屉
        const percentage = Math.min(state.distanceX / 280, 1) * 100
        drawerTranslateX.value = -100 + percentage
      } else if (state.direction.primary === 'left') {
        // 从右向左滑动，隐藏抽屉
        const percentage = Math.min(Math.abs(state.distanceX) / 280, 1) * 100
        drawerTranslateX.value = -percentage
      }
    },
    onSwipeEnd: (state, direction) => {
      isDragging.value = false
      const velocityThreshold = 0.5
      const isFastSwipe = state.velocity > velocityThreshold
      if (direction.primary === 'right' && (state.absX > 280 * 0.3 || isFastSwipe)) {
        // 向右滑动超过30%，完全显示
        drawerTranslateX.value = 0
      } else if (direction.primary === 'left' && (state.absX > 280 * 0.3 || isFastSwipe)) {
        // 向左滑动超过30%，关闭菜单
        closeMenu()
      }
      // 保持当前位置，让 CSS transition 处理
    },
    onSwipeCancel: () => {
      isDragging.value = false
      drawerTranslateX.value = -100
    },
  },
  {
    horizontal: true,
    vertical: false,
    threshold: 50,
    maxDuration: 1000,
    preventScroll: true,
  }
)
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

    <!-- 抽屉 - 使用 ref 引用 DrawerPanel 以应用滑动手势 -->
    <Transition name="drawer">
      <div
        v-if="isOpen"
        ref="drawerRef"
        class="fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] z-50 md:hidden"
        :style="{
          transform: drawerTransform,
          transition: isDragging ? 'none' : undefined
        }"
      >
        <DrawerPanel
          :nav-items="navItems"
          :transform="drawerTransform"
          @close="closeMenu"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 遮罩层动画 */
.backdrop-enter-active {
  transition: opacity 300ms ease-out;
}

.backdrop-leave-active {
  transition: opacity 200ms ease-out;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* 抽屉滑入动画 - 优化的弹性缓动 */
.drawer-enter-active {
  transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.drawer-leave-active {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.8, 1);
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
