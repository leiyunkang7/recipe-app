<script setup lang="ts">
const { t } = useI18n()

const searchQuery = defineModel<string>('searchQuery', { default: '' })

const emit = defineEmits<{
  search: []
}>()

// 入场动画 - 使用 composable 统一管理
const { isEntered } = useEnterAnimation({ delay: 50 })

// 响应式布局检测 - 使用统一的 composable，避免内存泄漏
const { isMobile } = useBreakpoint()

// 动态样式计算 - 合并移动端和桌面端的差异
const headerClasses = computed(() =>
  isMobile.value
    ? 'md:hidden'
    : 'hidden md:block'
)

const containerClasses = computed(() =>
  isMobile.value
    ? 'px-6 py-8'
    : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'
)

const layoutClasses = computed(() =>
  isMobile.value
    ? 'flex-col items-center text-center'
    : 'flex-row items-center justify-between gap-4'
)

const titleClasses = computed(() =>
  isMobile.value
    ? 'text-xl sm:text-2xl md:text-3xl mb-2'
    : 'text-2xl mb-0'
)

const emojiClasses = computed(() =>
  isMobile.value
    ? 'text-4xl sm:text-5xl mb-3'
    : 'text-4xl mb-0'
)

const searchContainerClasses = computed(() =>
  isMobile.value
    ? 'w-full max-w-md mx-auto'
    : 'flex-1 max-w-xl mx-4'
)

const themeToggleClasses = computed(() =>
  isMobile.value
    ? 'flex justify-center mt-4'
    : ''
)
</script>

<template>
  <header
    :class="[
      'relative overflow-hidden bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 transition-all duration-500',
      headerClasses,
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
    <div :class="['relative transition-all duration-500', containerClasses]">
      <div :class="['flex gap-3', layoutClasses]">
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
              emojiClasses,
              isEntered ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            ]"
          >
            🍳
          </span>
          <div>
            <h1
              :class="[
                'font-bold text-white drop-shadow-lg transition-all duration-500 delay-200',
                titleClasses,
                isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              ]"
            >
              {{ t('app.title') }}
            </h1>
            <p
              :class="[
                'text-orange-100 text-sm opacity-90 transition-all duration-500 delay-300',
                isMobile ? '' : '',
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
            searchContainerClasses,
            isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          ]"
        >
          <div :class="['relative', isMobile ? '' : '']">
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
            themeToggleClasses,
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
