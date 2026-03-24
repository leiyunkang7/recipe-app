<script setup lang="ts">
/**
 * MobileNavbarHeader - 移动端顶部导航栏
 *
 * 包含 Logo 和汉堡菜单按钮
 */

interface Props {
  isMenuOpen: boolean
  isEntered: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  toggleMenu: []
  menuKeydown: [event: KeyboardEvent]
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const handleMenuKeyDown = (event: KeyboardEvent) => {
  emit('menuKeydown', event)
}
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-b border-gray-200/80 dark:border-stone-700/80 transition-all duration-500 ease-out"
    :class="isEntered ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'"
    style="transition-delay: 0ms;"
  >
    <div class="flex items-center justify-between h-14 px-4">
      <!-- Logo -->
      <NuxtLink
        :to="localePath('/', locale)"
        class="flex items-center gap-2 text-lg font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-lg"
        :aria-label="t('app.title')"
      >
        <span class="text-2xl">🍳</span>
        <span class="hidden sm:inline">{{ t('app.title') }}</span>
      </NuxtLink>

      <!-- 汉堡菜单按钮 -->
      <button
        @click="emit('toggleMenu')"
        @keydown="handleMenuKeyDown"
        class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 touch-manipulation"
        :aria-label="isMenuOpen ? t('common.close', '关闭菜单') : t('nav.openMenu', '打开菜单')"
        :aria-expanded="isMenuOpen"
        aria-controls="mobile-menu-drawer"
      >
        <!-- 汉堡图标动画 - 改进的弹簧物理效果 -->
        <span class="relative w-5 h-4" :class="isMenuOpen ? 'scale-90' : 'scale-100'">
          <span
            class="absolute left-0 top-0 w-full h-0.5 bg-gray-600 dark:bg-stone-300 rounded-full origin-center transition-all ease-[cubic-bezier(0.68,-0.55,0.27,1.55)]"
            :class="isMenuOpen ? 'rotate-45 top-1/2 -mt-0.5' : 'top-0 mt-0'"
            style="transition-duration: 300ms;"
          ></span>
          <span
            class="absolute left-0 top-1/2 w-full h-0.5 bg-gray-600 dark:bg-stone-300 rounded-full -translate-y-1/2 transition-all ease-[cubic-bezier(0.68,-0.55,0.27,1.55)]"
            :class="isMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'"
            style="transition-duration: 200ms;"
          ></span>
          <span
            class="absolute left-0 bottom-0 w-full h-0.5 bg-gray-600 dark:bg-stone-300 rounded-full origin-center transition-all ease-[cubic-bezier(0.68,-0.55,0.27,1.55)]"
            :class="isMenuOpen ? '-rotate-45 top-1/2 -mt-0.5' : 'bottom-0 mb-0'"
            style="transition-duration: 300ms;"
          ></span>
        </span>
      </button>
    </div>
  </header>
</template>
