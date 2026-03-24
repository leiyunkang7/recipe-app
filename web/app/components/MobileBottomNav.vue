<script setup lang="ts">
/**
 * MobileBottomNav - 移动端底部导航栏
 *
 * 包含底部标签导航和触摸反馈
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

// 判断路由是否激活
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/' || route.path.startsWith('/recipes/')
  }
  return route.path.startsWith(path)
}

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

// 底部导航键盘导航
const bottomNavRef = ref<HTMLElement | null>(null)
const handleBottomNavKeyDown = (event: KeyboardEvent) => {
  const nav = bottomNavRef.value
  if (!nav) return

  const tabs = nav.querySelectorAll<HTMLElement>('[role="tab"], a')
  const currentIndex = Array.from(tabs).indexOf(document.activeElement as HTMLElement)

  let nextIndex: number | null = null

  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault()
      nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
      break
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault()
      nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0
      break
    case 'Home':
      event.preventDefault()
      nextIndex = 0
      break
    case 'End':
      event.preventDefault()
      nextIndex = tabs.length - 1
      break
  }

  if (nextIndex !== null && tabs[nextIndex]) {
    tabs[nextIndex].focus()
  }
}
</script>

<template>
  <nav
    ref="bottomNavRef"
    class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-t border-gray-200/80 dark:border-stone-700/80 z-50 mobile-safe-bottom transition-all duration-300"
    :class="isEntered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'"
    role="navigation"
    :aria-label="t('nav.bottomNavAria', '底部导航')"
    @keydown="handleBottomNavKeyDown"
  >
    <!-- 触摸目标扩展区域 -->
    <div class="flex items-center justify-around h-14 min-h-[56px] touch-manipulation">
      <MobileNavTab
        v-for="(tab, index) in tabs"
        :key="tab.path"
        :tab="tab"
        :is-active="isActive(tab.path)"
        :is-pressed="pressedTab === tab.path"
        :ripple-position="pressedTab === tab.path ? ripplePosition : null"
        :tab-index="index"
        :style="{
          transitionDelay: isEntered ? `${index * 50}ms` : '0ms'
        }"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
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

/* 入场动画 */
.translate-y-full {
  transform: translateY(100%);
}

.translate-y-0 {
  transform: translateY(0);
}
</style>
