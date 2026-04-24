<script setup lang="ts">
/**
 * HeroSection - 首页 Hero 区域组件
 *
 * 功能：
 * - 渐变背景 + 动态光效动画
 * - Logo 和应用标题展示
 * - 搜索框集成，触发 search 事件
 * - 主题切换按钮
 * - 响应式布局 (移动端/桌面端)
 * - 入场动画效果
 * - 波浪分隔线装饰
 * - 搜索历史记录功能
 *
 * 使用方式：
 * <HeroSection v-model:searchQuery="query" @search="handleSearch" />
 */
const { t, locale } = useI18n()
const localePath = useLocalePath()

const searchQuery = defineModel<string>('searchQuery', { default: '' })

const emit = defineEmits<{
  search: []
}>()

// 入场动画 - 默认已进入，确保 E2E 测试和 SEO 可见性
const { isEntered } = useEnterAnimation({ delay: 50, immediate: true })

// 响应式布局检测 - 使用统一的 composable，避免内存泄漏
const { isMobile } = useBreakpoint()

// 搜索历史
const { history, addSearch, removeSearch, clearHistory } = useSearchHistory()
const showHistory = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

// Track blur timer for cleanup on unmount
let blurTimer: ReturnType<typeof setTimeout> | null = null

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}

const handleFocus = () => {
  if (history.value.length > 0) {
    showHistory.value = true
  }
}

const handleBlur = (e: FocusEvent) => {
  // Delay to allow click on history item
  if (blurTimer) clearTimeout(blurTimer)
  blurTimer = setTimeout(() => {
    blurTimer = null
    const target = e.relatedTarget as Node | null
    if (!searchInputRef.value?.contains(target)) {
      showHistory.value = false
    }
  }, 150)
}

const selectHistoryItem = (term: string) => {
  searchQuery.value = term
  showHistory.value = false
  emit('search')
}

const handleRemoveHistory = (e: Event, term: string) => {
  e.stopPropagation()
  removeSearch(term)
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    addSearch(searchQuery.value.trim())
  }
  emit('search')
}

// 优化：使用单一 computed 减少响应式依赖
// 将所有响应式类合并到一个对象中，避免 7 个独立 computed 各自追踪 isMobile 变化
const mobileClasses = {
  headerClass: 'md:hidden',
  containerClass: 'px-6 py-8',
  layoutClass: 'flex-col items-center text-center',
  titleClass: 'text-xl sm:text-2xl md:text-3xl mb-2',
  emojiClass: 'text-4xl sm:text-5xl mb-3',
  searchClass: 'w-full max-w-md mx-auto',
  themeToggleClass: 'flex justify-center mt-4',
}

const desktopClasses = {
  headerClass: 'hidden md:block',
  containerClass: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6',
  layoutClass: 'flex-row items-center justify-between gap-4',
  titleClass: 'text-2xl mb-0',
  emojiClass: 'text-4xl mb-0',
  searchClass: 'flex-1 max-w-xl mx-4',
  themeToggleClass: '',
}

onMounted(() => {
  // Ensure cleanup if component is remounted
  if (blurTimer) {
    clearTimeout(blurTimer)
    blurTimer = null
  }
})

onUnmounted(() => {
  if (blurTimer) {
    clearTimeout(blurTimer)
    blurTimer = null
  }
})

const currentClasses = computed(() => isMobile.value ? mobileClasses : desktopClasses)
</script>

<template>
  <header
    :class="[
      'relative overflow-hidden bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 transition-all duration-500',
      currentClasses.headerClass,
      isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    ]"
  >
    <!-- 渐变背景 + 动态光效 -->
    <div class="absolute inset-0 overflow-hidden">
      <div
        :class="[
          'absolute -top-1/2 -right-1/4 rounded-full bg-white/10 blur-3xl animate-pulse',
          isMobile ? 'w-64 h-64 sm:w-80 sm:h-80' : 'w-[600px] h-[600px]'
        ]"
      ></div>
      <div
        class="absolute -bottom-1/2 -left-1/4 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse"
        style="animation-delay: 1000ms;"
      ></div>
    </div>

    <!-- 内容区 -->
    <div :class="['relative transition-all duration-500', currentClasses.containerClass]">
      <div :class="['flex gap-3', currentClasses.layoutClass]">
        <!-- Logo 和标题 -->
        <div
          :class="[
            'flex items-center gap-3 transition-all duration-500',
            isMobile ? 'flex-col' : '',
            isEntered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          ]"
        >
          <span
            aria-hidden="true"
            :class="[
              'transition-all duration-500 delay-100',
              currentClasses.emojiClass,
              isEntered ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            ]"
          >
            🍳
          </span>
          <div>
            <h1
              :class="[
                'font-bold text-white drop-shadow-lg transition-all duration-500 delay-200',
                currentClasses.titleClass,
                isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              ]"
            >
              {{ t('app.title') }}
            </h1>
            <p
              :class="[
                'text-orange-100 text-sm opacity-90 transition-all duration-500 delay-300',
                isEntered ? 'opacity-90 translate-y-0' : 'opacity-0 translate-y-4'
              ]"
            >
              {{ t('app.subtitle') }}
            </p>
          </div>
        </div>

        <!-- 搜索框 -->
        <div
          :class="[
            'transition-all duration-500 delay-200',
            currentClasses.searchClass,
            isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          ]"
        >
          <div class="relative" role="search">
            <input
              id="hero-search"
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="t('search.placeholder')"
              :class="[
                'w-full rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 text-white placeholder-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all text-base',
                isMobile ? 'px-4 sm:px-5 py-4 sm:py-3.5 pl-11 sm:pl-12' : 'px-5 py-3 pl-12'
              ]"
              @input="handleSearch"
              @focus="handleFocus"
              @blur="handleBlur"
              @keydown.escape="showHistory = false"
            />
            <label for="hero-search" class="sr-only">{{ t('search.placeholder') }}</label>
            <SearchIcon aria-hidden="true" class="absolute left-4 top-1/2 -translate-y-1/2 text-white/80" />

            <!-- 搜索历史下拉 -->
            <div
              v-if="showHistory && history.length > 0"
              class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 overflow-hidden z-50"
            >
              <div class="flex items-center justify-between px-4 py-2 border-b border-stone-200 dark:border-stone-700">
                <span class="text-sm text-stone-500 dark:text-stone-400">{{ t('search.recentSearches') }}</span>
                <button
                  type="button"
                  class="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                  @click="clearHistory"
                >
                  {{ t('search.clearHistory') }}
                </button>
              </div>
              <ul class="max-h-64 overflow-y-auto">
                <li
                  v-for="term in history"
                  :key="term"
                  class="flex items-center justify-between px-4 py-2.5 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer group"
                  @mousedown.prevent="selectHistoryItem(term)"
                >
                  <span class="text-stone-700 dark:text-stone-200">{{ term }}</span>
                  <button
                    type="button"
                    class="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1"
                    @mousedown.prevent
                    @click="handleRemoveHistory($event, term)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 主题切换 -->
        <div
          :class="[
            'transition-all duration-500 delay-300',
            currentClasses.themeToggleClass,
            isEntered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          ]"
        >
          <div class="flex items-center gap-3">
            <ThemeToggle />
            <NuxtLink
              :to="localePath('/admin', locale)"
              class="hidden md:flex px-4 py-2 bg-white/20 backdrop-blur-xl text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
            >
              {{ t('nav.admin') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- 波浪分隔 -->
    <WaveDivider :height="isMobile ? 'h-8' : 'h-10'" />
  </header>
</template>
