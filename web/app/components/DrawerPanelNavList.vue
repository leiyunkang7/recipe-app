<script setup lang="ts">
/**
 * DrawerPanelNavList - 抽屉面板导航列表
 *
 * 特性：
 * - 入场动画（导航项错开）
 * - 键盘导航（roving tabindex）
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
  isContentVisible: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

// 当前聚焦的导航项索引（用于 roving tabindex）
const focusedIndex = ref(0)

// 判断是否是首页路由
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/' || route.path.startsWith('/recipes/')
  }
  return route.path.startsWith(path)
}

// 聚焦导航项
const focusNavItem = (index: number) => {
  const navItem = navItemRefs.value[index]
  if (navItem) {
    const link = navItem.querySelector('a') as HTMLElement | null
    link?.focus()
  }
  focusedIndex.value = index
}

// 键盘导航（roving tabindex 模式）
const handleKeyDown = (event: KeyboardEvent) => {
  const itemCount = navItemRefs.value.length

  switch (event.key) {
    case 'ArrowDown':
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
  emit('close')
}

// 存储所有导航项的 refs
const navItemRefs = ref<HTMLElement[]>([])

const setNavItemRef = (el: HTMLElement | null, index: number) => {
  if (el) {
    navItemRefs.value[index] = el
  }
}

defineExpose({
  focusFirstItem: () => {
    const firstItem = navItemRefs.value[0]
    if (firstItem) {
      const link = firstItem.querySelector('a') as HTMLElement | null
      link?.focus()
    }
  }
})
</script>

<template>
  <!-- 导航列表 -->
  <nav class="p-4" :aria-label="t('aria.mainNav')" @keydown="handleKeyDown">
    <ul class="space-y-2" role="list">
      <li
        v-for="(item, index) in navItems"
        :key="item.path"
        :ref="(el) => setNavItemRef(el as HTMLElement, index)"
        :class="[
          'transform transition-all duration-400 ease-out',
          isContentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
        ]"
        :style="{
          transitionDelay: isContentVisible ? `${index * 80}ms` : '0ms',
          transitionTimingFunction: isContentVisible ? 'cubic-bezier(0.34, 1.2, 0.64, 1)' : 'ease-out'
        }"
      >
        <NuxtLink
          :to="localePath(item.path, locale)"
          :data-nav-item="index"
          :tabindex="focusedIndex === index ? 0 : -1"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 min-h-[48px] touch-manipulation',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-stone-900',
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
            :aria-label="t('aria.favoritesCount', { count: item.badge })"
          >
            {{ item.badge > 99 ? '99+' : item.badge }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
