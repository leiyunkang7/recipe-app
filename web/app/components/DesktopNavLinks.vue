<script setup lang="ts">
/**
 * DesktopNavLinks - 桌面端导航链接
 *
 * 特性：
 * - Roving tabindex 键盘导航
 * - 箭头键左右导航
 * - Home/End 键跳转
 * - 当前页面ARIA状态
 */
import type { Component } from 'vue'

interface NavLink {
  path: string
  label: string
  icon: Component
  badge?: number
}

interface Props {
  links: NavLink[]
  isActive: (path: string) => boolean
}

defineProps<Props>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

// 当前聚焦的导航项索引
const focusedIndex = ref(0)

// 导航项 refs
const navRefs = ref<(HTMLElement | null)[]>([])

// 设置 ref
const setNavRef = (el: unknown, index: number) => {
  navRefs.value[index] = el as HTMLElement | null
}

// 键盘导航
const handleNavKeyDown = (event: KeyboardEvent) => {
  const links = event.currentTarget as HTMLElement
  const focusable = links.querySelectorAll<HTMLElement>('a[role="menuitem"]')
  const currentIndex = Array.from(focusable).indexOf(event.target as HTMLElement)

  let nextIndex: number | null = null

  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault()
      nextIndex = currentIndex < focusable.length - 1 ? currentIndex + 1 : 0
      break
    case 'ArrowLeft':
      event.preventDefault()
      nextIndex = currentIndex > 0 ? currentIndex - 1 : focusable.length - 1
      break
    case 'Home':
      event.preventDefault()
      nextIndex = 0
      break
    case 'End':
      event.preventDefault()
      nextIndex = focusable.length - 1
      break
  }

  if (nextIndex !== null && focusable[nextIndex]) {
    focusedIndex.value = nextIndex
    focusable[nextIndex]!.focus()
  }
}

// 聚焦处理
const handleFocus = (index: number) => {
  focusedIndex.value = index
}
</script>

<template>
  <nav
    class="hidden lg:flex items-center gap-1"
    role="menubar"
    :aria-label="t('nav.mainNavAria', '主导航')"
    @keydown="handleNavKeyDown"
  >
    <NuxtLink
      v-for="(link, index) in links"
      :key="link.path"
      :ref="(el) => setNavRef(el, index)"
      :to="localePath(link.path, locale)"
      :tabindex="focusedIndex === index ? 0 : -1"
      role="menuitem"
      :class="[
        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        isActive(link.path)
          ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
          : 'text-gray-600 dark:text-stone-300 hover:text-gray-900 dark:hover:text-stone-100 hover:bg-gray-50 dark:hover:bg-stone-800'
      ]"
      :aria-current="isActive(link.path) ? 'page' : undefined"
      @focus="handleFocus(index)"
    >
      <component :is="link.icon" class="w-5 h-5" />
      <span>{{ link.label }}</span>
      <span
        v-if="link.badge && link.badge > 0"
        class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1"
        :aria-label="t('aria.favoritesCount', { count: link.badge })"
      >
        {{ link.badge > 99 ? '99+' : link.badge }}
      </span>
    </NuxtLink>
  </nav>
</template>
