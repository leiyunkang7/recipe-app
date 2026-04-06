<script setup lang="ts">
/**
 * MobileBottomNav - 移动端底部导航栏
 *
 * 包含底部标签导航和触摸反馈
 * 特性：
 * - Roving tabindex 键盘导航
 * - 触摸涟漪效果
 * - 入场动画
 * - 暗色模式支持
 */

interface Tab {
  path: string
  icon: string
  activeIcon: string
  label: string
  ariaLabel: string
  badge?: number
}

interface Props {
  tabs: Tab[]
  isEntered: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  touchstart: [path: string, event: TouchEvent]
  touchend: []
}>()

const route = useRoute()
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

// 判断路由是否激活
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/' || route.path.startsWith('/recipes/')
  }
  return route.path.startsWith(path)
}

// 当前聚焦的标签索引（用于 roving tabindex）
const focusedIndex = ref(0)

// 触摸反馈状态
const pressedTab = ref<string | null>(null)
const ripplePosition = ref<{ x: number; y: number } | null>(null)

// 触摸处理
const handleTouchStart = (path: string, event: TouchEvent) => {
  pressedTab.value = path
  const touch = event.touches[0]
  if (touch) {
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    ripplePosition.value = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  }
}

const handleTouchEnd = () => {
  pressedTab.value = null
  ripplePosition.value = null
  emit('touchend')
}

// 底部导航键盘导航（roving tabindex 模式）
const bottomNavRef = ref<HTMLElement | null>(null)
const handleBottomNavKeyDown = (event: KeyboardEvent) => {
  const nav = bottomNavRef.value
  if (!nav) return

  const tabs = nav.querySelectorAll<HTMLElement>('[role="tab"]')
  const tabCount = tabs.length

  if (tabCount === 0) return

  let nextIndex: number | null = null

  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault()
      nextIndex = focusedIndex.value > 0 ? focusedIndex.value - 1 : tabCount - 1
      break
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault()
      nextIndex = focusedIndex.value < tabCount - 1 ? focusedIndex.value + 1 : 0
      break
    case 'Home':
      event.preventDefault()
      nextIndex = 0
      break
    case 'End':
      event.preventDefault()
      nextIndex = tabCount - 1
      break
  }

  if (nextIndex !== null && tabs[nextIndex]) {
    focusedIndex.value = nextIndex
    ;(tabs[nextIndex] as HTMLAnchorElement).focus()
  }
}

// 处理标签聚焦
const handleTabFocus = (index: number) => {
  focusedIndex.value = index
}
</script>

<template>
  <nav
    ref="bottomNavRef"
    class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-t border-gray-200/80 dark:border-stone-700/80 z-50 mobile-safe-bottom transition-all duration-500"
    :class="isEntered ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-[0.98]'"
    style="transition-timing-function: cubic-bezier(0.34, 1.2, 0.64, 1);"
    role="navigation"
    :aria-label="t('aria.bottomNav')"
    @keydown="handleBottomNavKeyDown"
  >
    <!-- Roving tablist 容器 -->
    <div role="tablist" :aria-label="t('aria.mainNavTabs')" class="flex items-center justify-around h-14 min-h-[56px] touch-manipulation">
      <MobileNavTab
        v-for="(tab, index) in tabs"
        :key="tab.path"
        :tab="tab"
        :is-active="isActive(tab.path)"
        :is-pressed="pressedTab === tab.path"
        :ripple-position="pressedTab === tab.path ? ripplePosition : null"
        :tab-index="index"
        :is-focused="focusedIndex === index"
        :class="isEntered ? 'entered' : ''"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        @tab-focus="handleTabFocus"
      />
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

/* 入场动画 - 改进的弹簧缓动 */
.translate-y-full {
  transform: translateY(100%);
}

.translate-y-0 {
  transform: translateY(0);
}

/* 底部导航标签入场错开动画 */
:deep([data-nav-tab]) {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 400ms ease-out, transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

:deep([data-nav-tab].entered) {
  opacity: 1;
  transform: translateY(0);
}

:deep([data-nav-tab]:nth-child(1)) { transition-delay: 0ms; }
:deep([data-nav-tab]:nth-child(2)) { transition-delay: 80ms; }
</style>
