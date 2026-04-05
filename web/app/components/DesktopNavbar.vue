<script setup lang="ts">
/**
 * DesktopNavbar - 桌面端顶部导航
 *
 * 特性：
 * - 只在桌面端显示（md及以上断点）
 * - 包含Logo、搜索框、导航链接
 * - 支持国际化切换
 * - 响应式搜索框（可折叠）
 * - 暗色模式支持
 * - 键盘可访问性优化
 */

interface Props {
  /** 搜索关键词（双向绑定） */
  modelValue?: string
  /** 是否显示搜索框 */
  showSearch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  showSearch: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
}>()

const { t } = useI18n()
const route = useRoute()

const searchQuery = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const { favoriteIds } = useFavorites()

// 入场动画 - 使用 composable 统一管理
const { isEntered } = useEnterAnimation({ delay: 50 })

// 导航链接
const navLinks = computed(() => [
  { path: '/', label: t('nav.home'), icon: '🏠' },
  { path: '/favorites', label: t('favorites.title'), icon: '❤️', badge: favoriteIds.value.size },
])

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/' || route.path.startsWith('/recipes/')
  }
  return route.path.startsWith(path)
}

// 搜索防抖 - 使用 VueUse 的 useDebounceFn 统一处理
const handleSearch = useDebounceFn(() => {
  emit('search', searchQuery.value)
}, 300, { maxWait: 500 })
</script>

<template>
  <!-- 只在桌面端显示 -->
  <header
    class="hidden md:block sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-gray-200 dark:border-stone-700 transition-all duration-500"
    :class="isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'"
    role="banner"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">

        <!-- Logo区域 -->
        <div
          class="flex items-center gap-8 transition-all duration-500"
          :class="isEntered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'"
        >
          <LogoSection />

          <!-- 导航链接 -->
          <DesktopNavLinks :links="navLinks" :is-active="isActive" />
        </div>

        <!-- 搜索框 -->
        <div
          v-if="showSearch"
          class="flex-1 max-w-md mx-4 transition-all duration-500 delay-100"
          :class="isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'"
        >
          <div class="relative">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-18 0 7 7 0 0118 0z"
              ></path>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('search.placeholder')"
              class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-stone-600 bg-gray-50 dark:bg-stone-800 text-gray-900 dark:text-stone-100 text-sm focus:bg-white dark:focus:bg-stone-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              :aria-label="t('search.placeholder')"
              @input="handleSearch"
            />
          </div>
        </div>

        <!-- 右侧操作区 -->
        <div
          class="transition-all duration-500 delay-200"
          :class="isEntered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'"
        >
          <DesktopNavbarActions />
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Backdrop blur support check */
@supports not (backdrop-filter: blur(12px)) {
  header {
    background-color: rgba(255, 255, 255, 0.98);
  }

  :global(.dark) header {
    background-color: rgba(41, 37, 36, 0.98);
  }
}
</style>
