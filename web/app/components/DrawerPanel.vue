<script setup lang="ts">
/**
 * DrawerPanel - 抽屉面板内容
 *
 * 包含 Header、导航列表和 Footer
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

// 当前聚焦的导航项索引
const focusedIndex = ref(-1)

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
}

// 键盘导航
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      closeMenu()
      break
    case 'ArrowDown':
      event.preventDefault()
      focusedIndex.value = focusedIndex.value < (props.navItems?.length || 0) - 1 ? focusedIndex.value + 1 : 0
      focusNavItem(focusedIndex.value)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusedIndex.value = focusedIndex.value > 0 ? focusedIndex.value - 1 : (props.navItems?.length || 0) - 1
      focusNavItem(focusedIndex.value)
      break
    case 'Tab':
      // 如果是 Shift+Tab 从第一个元素离开，聚焦到最后一个
      if (event.shiftKey && document.activeElement === firstFocusableRef.value) {
        event.preventDefault()
        lastFocusableRef.value?.focus()
      }
      // 如果是 Tab 从最后一个元素离开，聚焦到第一个
      else if (!event.shiftKey && document.activeElement === lastFocusableRef.value) {
        event.preventDefault()
        firstFocusableRef.value?.focus()
      }
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
    firstFocusableRef.value?.focus()
    // 短暂延迟后触发内容入场动画
    requestAnimationFrame(() => {
      setTimeout(() => {
        isContentVisible.value = true
      }, 50)
    })
  })
})
</script>

<template>
  <div
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
        <svg class="w-6 h-6 text-gray-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
              isActive(item.path)
                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                : 'text-gray-700 dark:text-stone-200 hover:bg-gray-50 dark:hover:bg-stone-800'
            ]"
            :aria-current="isActive(item.path) ? 'page' : undefined"
            @click="handleNavClick"
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
