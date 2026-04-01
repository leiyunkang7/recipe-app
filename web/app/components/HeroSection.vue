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
const { t } = useI18n()

const searchQuery = defineModel<string>('searchQuery', { default: '' })

const emit = defineEmits<{
  search: []
}>()

// 入场动画 - 使用 composable 统一管理
const { isEntered } = useEnterAnimation({ delay: 50 })

// 响应式布局检测 - 使用统一的 composable，避免内存泄漏
const { isMobile } = useBreakpoint()

// 合并响应式样式计算 - isMobile 只计算一次，减少响应式追踪开销
// 各属性独立 computed，按需计算，避免不必要的全量更新
const responsiveClasses = computed(() => isMobile.value ? {
  header: 'md:hidden',
  container: 'px-6 py-8',
  layout: 'flex-col items-center text-center',
  title: 'text-xl sm:text-2xl md:text-3xl mb-2',
  emoji: 'text-4xl sm:text-5xl mb-3',
  search: 'w-full max-w-md mx-auto',
  themeToggle: 'flex justify-center mt-4',
} : {
  header: 'hidden md:block',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6',
  layout: 'flex-row items-center justify-between gap-4',
  title: 'text-2xl mb-0',
  emoji: 'text-4xl mb-0',
  search: 'flex-1 max-w-xl mx-4',
  themeToggle: '',
})
</script>

<template>
  <header
    :class="[
      'relative overflow-hidden bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 transition-all duration-500',
      responsiveClasses.header,
      isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    ]"
  >
    <!-- 渐变背景 + 动态光效 -->
    <div class="absolute inset-0 overflow-hidden">
      <div
        :class="[
          'absolute -top-1/2 -right-1/4 rounded-full bg-white/10 blur-3xl animate-pulse',
          isMobile ? 'w-96 h-96' : 'w-[600px] h-[600px]'
        ]"
      ></div>
      <div
        class="absolute -bottom-1/2 -left-1/4 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse"
        style="animation-delay: 1000ms;"
      ></div>
    </div>

    <!-- 内容区 -->
    <div :class="['relative transition-all duration-500', responsiveClasses.container]">
      <div :class="['flex gap-3', responsiveClasses.layout]">
        <!-- Logo 和标题 -->
        <div
          :class="[
            'flex items-center gap-3 transition-all duration-500',
            isMobile ? 'flex-col' : '',
            isEntered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          ]"
        >
          <span
            :class="[
              'transition-all duration-500 delay-100',
              responsiveClasses.emoji,
              isEntered ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            ]"
          >
            🍳
          </span>
          <div>
            <h1
              :class="[
                'font-bold text-white drop-shadow-lg transition-all duration-500 delay-200',
                responsiveClasses.title,
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
            responsiveClasses.search,
            isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          ]"
        >
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('search.placeholder')"
              :class="[
                'w-full rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all text-base',
                isMobile ? 'px-4 sm:px-5 py-3 sm:py-3.5 pl-11 sm:pl-12' : 'px-5 py-3 pl-12'
              ]"
              @input="emit('search')"
            />
            <SearchIcon class="absolute left-4 top-1/2 -translate-y-1/2 text-white/80" />
          </div>
        </div>

        <!-- 主题切换 -->
        <div
          :class="[
            'transition-all duration-500 delay-300',
            responsiveClasses.themeToggle,
            isEntered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          ]"
        >
          <ThemeToggle />
        </div>
      </div>
    </div>

    <!-- 波浪分隔 -->
    <WaveDivider :height="isMobile ? 'h-8' : 'h-10'" />
  </header>
</template>
