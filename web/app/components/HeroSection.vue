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
 *
 * 使用方式：
 * <HeroSection v-model:search-query="query" @search="handleSearch" />
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
              v-model="searchQuery"
              type="text"
              :placeholder="t('search.placeholder')"
              :class="[
                'w-full rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 text-white placeholder-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all text-base',
                isMobile ? 'px-4 sm:px-5 py-4 sm:py-3.5 pl-11 sm:pl-12' : 'px-5 py-3 pl-12'
              ]"
              @input="emit('search')"
              @focus="$el.scrollIntoView({ behavior: 'smooth', block: 'center' })"
            />
            <label for="hero-search" class="sr-only">{{ t('search.placeholder') }}</label>
            <SearchIcon aria-hidden="true" class="absolute left-4 top-1/2 -translate-y-1/2 text-white/80" />
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
