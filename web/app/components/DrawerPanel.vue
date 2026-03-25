<script setup lang="ts">
/**
 * DrawerPanel - 抽屉面板内容
 *
 * 包含 Header、导航列表和 Footer
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

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

// Refs for focus management
const firstFocusableRef = ref<HTMLElement | null>(null)
const lastFocusableRef = ref<HTMLElement | null>(null)

// 当前聚焦的导航项索引（用于 roving tabindex）
const focusedIndex = ref(0)

// 判断是否是首页路由
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/' || route.path.startsWith('/recipes/')
  }
  return route.path.startsWith(path)
}

// 关闭菜单
const closeMenu = () => {
  emit('close')
}

// 聚焦导航项
const focusNavItem = (index: number) => {
  const items = drawerRef.value?.querySelectorAll('[data-nav-item]')
  const target = items?.[index] as HTMLElement | undefined
  target?.focus()
  focusedIndex.value = index
}

// 键盘导航（roving tabindex 模式）
const handleKeyDown = (event: KeyboardEvent) => {
  const items = drawerRef.value?.querySelectorAll('[data-nav-item]')
  const itemCount = items?.length || 0

  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      closeMenu()
      break
    case 'ArrowDown':
    case 'Tab':
      // 如果是 Tab 且没有按 Shift，则正常流转
      if (event.key === 'Tab' && event.shiftKey) {
        // Shift+Tab 处理在 focus trap 中
        return
      }
      event.preventDefault()
      const nextIndex = focusedIndex.value < itemCount - 1 ? focusedIndex.value + 1 : 0
      focusNavItem(nextIndex)
      break
    case 'ArrowUp':
      event.preventDefault()
      const prevIndex = focusedIndex.value > 0 ? focusedIndex.value - 1 : itemCount - 1
      focusNavItem(prevIndex)
      break
    case 'Home':
      event.preventDefault()
      focusNavItem(0)
      break
    case 'End':
      event.preventDefault()
      focusNavItem(itemCount - 1)
      break
  }
}

// 点击导航项后关闭
const handleNavClick = () => {
  closeMenu()
}

const drawerRef = ref<HTMLElement | null>(null)
const isContentVisible = ref(false)

// 延迟显示内容以实现入场动画
onMounted(() => {
  nextTick(() => {
    // 初始聚焦到第一个导航项
    firstFocusableRef.value?.focus()
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
    ref="drawerRef"
    class="fixed top-0 left-0 bottom-0 w-72 max-w-[80vw] bg-white dark:bg-stone-900 z-50 md:hidden shadow-2xl"
    role="dialog"
    aria-modal="true"
    :aria-label="t('nav.mobileMenu', '导航菜单')"
    @keydown="handleKeyDown"
  >
    <!-- 头部 - 入场动画 -->
    <div
      class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-stone-700 transform transition-all duration-300 ease-out"
      :class="isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl">🍳</span>
        <span class="font-bold text-orange-600 dark:text-orange-400">{{ t('app.title') }}</span>
      </div>
      <button
        ref="lastFocusableRef"
        @click="closeMenu"
        class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        :aria-label="t('common.close', '关闭')"
      >
        <svg class="w-6 h-6 text-gray-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- 导航列表 -->
    <nav class="p-4" aria-label="主导航">
      <ul class="space-y-2" role="list">
        <li
          v-for="(item, index) in navItems"
          :key="item.path"
          :class="[
            'transform transition-all duration-300 ease-out',
            isContentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
          ]"
          :style="{ transitionDelay: isContentVisible ? `${index * 60}ms` : '0ms' }"
        >
          <NuxtLink
            :to="localePath(item.path, locale)"
            :data-nav-item="index"
            :ref="index === 0 ? firstFocusableRef : undefined"
            :tabindex="focusedIndex === index ? 0 : -1"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
              isActive(item.path)
                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                : 'text-gray-700 dark:text-stone-200 hover:bg-gray-50 dark:hover:bg-stone-800'
            ]"
            :aria-current="isActive(item.path) ? 'page' : undefined"
            @click="handleNavClick"
            @focus="focusedIndex = index"
          >
            <span class="text-xl" aria-hidden="true">{{ item.icon }}</span>
            <span class="font-medium">{{ item.label }}</span>
            <span
              v-if="item.badge && item.badge > 0"
              class="ml-auto min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1"
              :aria-label="`${item.badge} 个收藏`"
            >
              {{ item.badge > 99 ? '99+' : item.badge }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- 底部信息 - 入场动画 -->
    <div
      class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-stone-700 transform transition-all duration-300 ease-out"
      :class="isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'"
    >
      <p class="text-xs text-gray-400 dark:text-stone-500 text-center">
        {{ t('app.subtitle') }}
      </p>
    </div>
  </div>
</template>
