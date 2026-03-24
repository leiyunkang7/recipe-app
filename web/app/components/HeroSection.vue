<script setup lang="ts">
const { t } = useI18n()

const searchQuery = defineModel<string>('searchQuery', { default: '' })

const emit = defineEmits<{
  search: []
}>()

const handleSearch = () => {
  emit('search')
}

// 入场动画 - 使用 composable 统一管理
const { isEntered } = useEnterAnimation({ delay: 50 })
</script>

<template>
  <!-- 移动端 Hero 头部 -->
  <header class="md:hidden relative overflow-hidden">
    <!-- 渐变背景 + 动态光效 -->
    <div class="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500"></div>
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-1/2 -left-1/4 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse" style="animation-delay: 1000ms;"></div>
    </div>

    <!-- 玻璃态内容 - 入场动画 -->
    <div
      class="relative px-6 py-8 transition-all duration-500"
      :class="isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
      <div class="text-center mb-6">
        <div
          class="text-4xl sm:text-5xl mb-3 transition-all duration-500 delay-100"
          :class="isEntered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'"
        >
          🍳
        </div>
        <h1
          class="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg transition-all duration-500 delay-200"
          :class="isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        >
          {{ t('app.title') }}
        </h1>
        <p
          class="text-orange-100 text-sm sm:text-base mb-4 opacity-90 transition-all duration-500 delay-300"
          :class="isEntered ? 'opacity-90 translate-y-0' : 'opacity-0 translate-y-4'"
        >
          {{ t('app.subtitle') }}
        </p>
      </div>

      <!-- 搜索框 - 玻璃态 -->
      <div
        class="relative transition-all duration-500 delay-400"
        :class="isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('search.placeholder')"
          class="w-full px-4 sm:px-5 py-3 sm:py-3.5 pl-11 sm:pl-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all text-base"
          @input="handleSearch"
        />
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-18 0 7 7 0 0118 0z"></path>
        </svg>
      </div>

      <!-- 移动端主题切换 -->
      <div
        class="flex justify-center mt-4 transition-all duration-500 delay-500"
        :class="isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        <ThemeToggle />
      </div>
    </div>

    <!-- 波浪分隔 -->
    <WaveDivider height="h-8" />
  </header>

  <!-- 桌面端 Hero 头部 -->
  <header class="hidden md:block relative overflow-hidden bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500">
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-2xl animate-pulse" style="animation-delay: 1000ms;"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between gap-4">
        <!-- Logo 和标题 - 入场动画 -->
        <div
          class="flex items-center gap-3 transition-all duration-500"
          :class="isEntered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'"
        >
          <span
            class="text-4xl transition-all duration-500 delay-100"
            :class="isEntered ? 'opacity-100 scale-100' : 'opacity-0 scale-50'"
          >
            🍳
          </span>
          <div>
            <h1 class="text-2xl font-bold text-white drop-shadow-lg">
              {{ t('app.title') }}
            </h1>
            <p class="text-orange-100 text-sm opacity-90">
              {{ t('app.subtitle') }}
            </p>
          </div>
        </div>

        <!-- 搜索框 - 桌面端 -->
        <div
          class="flex-1 max-w-xl transition-all duration-500 delay-200"
          :class="isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        >
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('search.placeholder')"
              class="w-full px-5 py-3 pl-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all text-base"
              @input="handleSearch"
            />
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-18 0 7 7 0 0118 0z"></path>
            </svg>
          </div>
        </div>

        <!-- 主题切换 -->
        <div
          class="transition-all duration-500 delay-300"
          :class="isEntered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'"
        >
          <ThemeToggle />
        </div>
      </div>
    </div>

    <!-- 波浪分隔 -->
    <WaveDivider height="h-10" />
  </header>
</template>
