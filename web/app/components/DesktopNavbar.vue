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

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const searchQuery = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const { favoriteIds } = useFavorites()

// 导航链接（管理入口已临时屏蔽）
const navLinks = computed(() => [
  { path: '/', label: t('nav.home'), icon: '🏠' },
  { path: '/favorites', label: t('favorites.title'), icon: '❤️', badge: favoriteIds.size },
  // { path: '/admin', label: t('nav.admin'), icon: '⚙️' }, // 临时屏蔽
])

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/' || route.path.startsWith('/recipes/')
  }
  return route.path.startsWith(path)
}

// 搜索防抖
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    emit('search', searchQuery.value)
  }, 300)
}
</script>

<template>
  <!-- 只在桌面端显示 -->
  <header class="hidden md:block sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-gray-200 dark:border-stone-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        
        <!-- Logo区域 -->
        <div class="flex items-center gap-8">
          <NuxtLink 
            :to="localePath('/', locale)" 
            class="flex items-center gap-2 text-xl font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
          >
            <span class="text-2xl">🍳</span>
            <span class="hidden sm:inline">{{ t('app.title') }}</span>
          </NuxtLink>

          <!-- 导航链接 -->
          <nav class="hidden lg:flex items-center gap-1">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.path"
              :to="localePath(link.path, locale)"
              :class="[
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
                isActive(link.path) 
                  ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20' 
                  : 'text-gray-600 dark:text-stone-300 hover:text-gray-900 dark:hover:text-stone-100 hover:bg-gray-50 dark:hover:bg-stone-800'
              ]"
            >
              <span>{{ link.icon }}</span>
              <span>{{ link.label }}</span>
              <span
                v-if="link.badge && link.badge > 0"
                class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1"
              >
                {{ link.badge > 99 ? '99+' : link.badge }}
              </span>
            </NuxtLink>
          </nav>
        </div>

        <!-- 搜索框 -->
        <div v-if="showSearch" class="flex-1 max-w-md mx-4">
          <div class="relative">
            <svg 
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
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
              @input="handleSearch"
            />
          </div>
        </div>

        <!-- 右侧操作区 -->
        <div class="flex items-center gap-2">
          <!-- 主题切换 -->
          <ThemeToggle />

          <!-- 语言切换 -->
          <LanguageSwitcher />

          <!-- 移动端菜单按钮（显示在md以下，但通常被MobileNavbar接管）-->
          <NuxtLink
            :to="localePath('/admin', locale)"
            class="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gray-900 dark:bg-stone-700 text-white dark:text-stone-100 rounded-lg hover:bg-gray-800 dark:hover:bg-stone-600 transition-colors text-sm font-medium"
          >
            <span>⚙️</span>
            <span class="hidden lg:inline">{{ t('nav.admin') }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* 隐藏滚动条但保持功能 */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

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
