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
 * - 弹簧物理动画反馈
 */

import { useSwipeGesture } from "~/composables/useSwipeGesture"

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
  emit("close")
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
const dragProgress = ref(0) // 0-1 拖动进度

// 抽屉宽度（用于计算百分比）
const DRAWER_WIDTH_PX = 280

// 弹簧动画参数
const SPRING_STIFFNESS = 300
const SPRING_DAMPING = 25
let animationFrameId: number | null = null
let velocity = 0
let lastTranslateX = -100

/**
 * 弹簧动画更新
 */
const springAnimate = (targetTranslateX: number) => {
  const stiffness = SPRING_STIFFNESS
  const damping = SPRING_DAMPING
  const mass = 1

  const animate = () => {
    const currentX = drawerTranslateX.value
    const displacement = currentX - targetTranslateX
    const springForce = -stiffness * displacement
    const dampingForce = -damping * velocity
    const acceleration = (springForce + dampingForce) / mass

    velocity += acceleration * (16 / 1000) // 假设 16ms 帧
    lastTranslateX = currentX + velocity * (16 / 1000)
    drawerTranslateX.value = lastTranslateX

    // 检查是否接近目标
    if (Math.abs(displacement) < 0.5 && Math.abs(velocity) < 0.5) {
      drawerTranslateX.value = targetTranslateX
      velocity = 0
      animationFrameId = null
      return
    }

    animationFrameId = requestAnimationFrame(animate)
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  animationFrameId = requestAnimationFrame(animate)
}

// 计算实际的 transform 字符串
const drawerTransform = computed(() => `translateX(${drawerTranslateX.value}%)`)

// 背景透明度
const backdropOpacity = computed(() => {
  const progress = 1 + drawerTranslateX.value / 100 // -100 to 0 -> 0 to 1
  return Math.max(0, Math.min(0.5, progress * 0.5))
})

// 使用增强的 swipe 手势 composable
useSwipeGesture(
  drawerRef,
  {
    horizontal: true,
    vertical: false,
    threshold: 50,
    maxDuration: 1000,
    preventScroll: true,
    hapticFeedback: true,
    onSwipeStart: () => {
      isDragging.value = true
      velocity = 0
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    },
    onSwipeMove: (state) => {
      if (state.direction.primary === "right") {
        // 从左向右滑动，显示抽屉
        const percentage = Math.min(state.distanceX / DRAWER_WIDTH_PX, 1) * 100
        drawerTranslateX.value = -100 + percentage
        dragProgress.value = percentage / 100
      } else if (state.direction.primary === "left") {
        // 从右向左滑动，隐藏抽屉
        const openAmount = 100 + drawerTranslateX.value // 0 to 100
        const percentage = Math.min(openAmount / DRAWER_WIDTH_PX, 1) * 100
        drawerTranslateX.value = -percentage
        dragProgress.value = 1 - percentage / 100
      }

      // 限制范围
      drawerTranslateX.value = Math.max(-100, Math.min(0, drawerTranslateX.value))
    },
    onSwipeEnd: (state, direction) => {
      isDragging.value = false
      const velocityThreshold = 0.5
      const isFastSwipe = state.velocity > velocityThreshold

      if (direction.primary === "right" && (state.absX > DRAWER_WIDTH_PX * 0.3 || isFastSwipe)) {
        // 向右滑动超过30%，完全显示
        springAnimate(0)
      } else if (direction.primary === "left" && (state.absX > DRAWER_WIDTH_PX * 0.3 || isFastSwipe)) {
        // 向左滑动超过30%，关闭菜单
        springAnimate(-100)
        setTimeout(closeMenu, 300)
      } else if (drawerTranslateX.value > -50) {
        // 超过一半开着，弹回开
        springAnimate(0)
      } else {
        // 不到一半开着，弹回关
        springAnimate(-100)
        if (drawerTranslateX.value < -50) {
          setTimeout(closeMenu, 300)
        }
      }
      dragProgress.value = 0
    },
    onSwipeCancel: () => {
      isDragging.value = false
      velocity = 0
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
      drawerTranslateX.value = -100
      dragProgress.value = 0
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
        :style="{ opacity: backdropOpacity }"
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
