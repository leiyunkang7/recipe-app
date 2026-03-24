<script setup lang="ts">
/**
 * MobileNavTab - 移动端导航单个标签
 *
 * 特性：
 * - Spring 物理动画反馈
 * - 活跃状态图标弹跳动画
 * - 触摸涟漪效果
 * - 暗色模式支持
 * - 键盘可访问性优化
 */

interface NavTab {
  path: string
  icon: string
  activeIcon: string
  label: string
  ariaLabel: string
  badge?: number
}

interface Props {
  tab: NavTab
  isActive: boolean
  isPressed: boolean
  ripplePosition: { x: number; y: number } | null
  tabIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  tabIndex: 0
})

const emit = defineEmits<{
  touchstart: [path: string, event: TouchEvent]
  touchend: []
  navKeydown: [event: KeyboardEvent, index: number]
}>()

const { locale } = useI18n()
const localePath = useLocalePath()

// 键盘导航处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    const link = event.currentTarget as HTMLAnchorElement
    link.click()
  }
  // 传递键盘事件给父组件处理
  emit('navKeydown', event, props.tabIndex)
}
</script>

<template>
  <NuxtLink
    :to="localePath(tab.path, locale)"
    :tabindex="isActive ? 0 : -1"
    :data-nav-tab="tabIndex"
    role="tab"
    :aria-selected="isActive"
    :class="[
      'relative flex flex-col items-center justify-center w-full h-full',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-inset',
      'transition-all duration-200 ease-out',
      isActive
        ? 'text-orange-600 dark:text-orange-400'
        : 'text-gray-400 dark:text-stone-500 hover:text-gray-600 dark:hover:text-stone-300',
      isPressed ? 'scale-90' : 'scale-100',
      isPressed ? 'brightness-90' : 'brightness-100'
    ]"
    :aria-label="tab.ariaLabel"
    :aria-current="isActive ? 'page' : undefined"
    @touchstart.passive="emit('touchstart', tab.path, $event)"
    @touchend="emit('touchend')"
    @touchcancel="emit('touchend')"
    @keydown="handleKeyDown"
  >
    <!-- 涟漪效果 -->
    <span
      v-if="isPressed && ripplePosition"
      class="absolute inset-0 overflow-hidden pointer-events-none"
    >
      <span
        class="absolute w-32 h-32 -translate-x-1/2 -translate-y-1/2 bg-white/30 dark:bg-white/20 rounded-full animate-ripple"
        :style="{
          left: `${ripplePosition.x}px`,
          top: `${ripplePosition.y}px`
        }"
      ></span>
    </span>

    <!-- 活跃指示器 - 弹跳动画 -->
    <span
      v-if="isActive"
      class="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-500 dark:bg-orange-400 rounded-full animate-bounce-subtle"
      aria-hidden="true"
    ></span>

    <!-- 图标容器 -->
    <span
      class="relative transition-transform duration-300 ease-out"
      :class="{ 'scale-125 -translate-y-0.5': isActive }"
    >
      <!-- 活跃时弹跳 -->
      <span
        class="text-2xl block transition-all duration-300"
        :class="{
          'scale-110': isActive && !isPressed,
          'scale-90': isPressed
        }"
      >
        {{ isActive ? tab.activeIcon : tab.icon }}
      </span>

      <!-- 未读徽章 -->
      <span
        v-if="tab.badge && tab.badge > 0 && !isActive"
        class="absolute -top-0.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-0.5 animate-pulse"
      >
        {{ tab.badge > 99 ? '99+' : tab.badge }}
      </span>
    </span>

    <!-- 标签 -->
    <span
      class="text-xs mt-0.5 font-medium transition-all duration-200"
      :class="{
        'text-orange-700 dark:text-orange-300 font-semibold': isActive
      }"
    >
      {{ tab.label }}
    </span>

    <!-- 底部活跃条 - 滑动动画 -->
    <span
      v-if="isActive"
      class="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 dark:bg-orange-400 rounded-full animate-slide-in"
      aria-hidden="true"
    ></span>
  </NuxtLink>
</template>

<style scoped>
/* 涟漪动画 */
@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

.animate-ripple {
  animation: ripple 400ms ease-out forwards;
}

/* 活跃指示器弹跳 */
@keyframes bounce-subtle {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-2px);
  }
}

.animate-bounce-subtle {
  animation: bounce-subtle 1.5s ease-in-out infinite;
}

/* 底部活跃条滑入 */
@keyframes slide-in {
  0% {
    transform: translateX(-50%) scaleX(0);
    opacity: 0;
  }
  100% {
    transform: translateX(-50%) scaleX(1);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
</style>
