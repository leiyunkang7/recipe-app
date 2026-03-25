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
</script>

<template>
  <!-- Hero 头部 - 统一组件，移动端居中布局，桌面端水平布局 -->
  <header
    class="relative overflow-hidden bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500"
    :class="isMobile ? 'md:hidden' : 'hidden md:block'"
  >
    <!-- 渐变背景 + 动态光效 -->
    <div class="absolute inset-0 overflow-hidden">
      <div
        class="absolute -top-1/2 rounded-full bg-white/10 animate-pulse"
        :class="isMobile ? '-right-1/4 w-96 h-96 blur-3xl' : '-right-1/4 w-[600px] h-[600px] blur-3xl'"
      ></div>
      <div
        class="absolute -bottom-1/2 -left-1/4 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse"
        style="animation-delay: 1000ms;"
      ></div>
    </div>

    <!-- 内容区 - 移动端居中 / 桌面端水平 -->
    <div
      class="relative transition-all duration-500"
      :class="[
        isMobile
          ? ['px-6 py-8', isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4']
          : ['max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6', isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4']
      ]"
    >
      <!-- 移动端：垂直居中布局 -->
      <template v-if="isMobile">
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

        <!-- 搜索框 - 移动端 -->
        <div
          class="relative transition-all duration-500 delay-400"
          :class="isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        >
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('search.placeholder')"
            class="w-full px-4 sm:px-5 py-3 sm:py-3.5 pl-11 sm:pl-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all text-base"
            @input="emit('search')"
          />
          <SearchIcon class="absolute left-4 top-1/2 -translate-y-1/2 text-white/80" />
        </div>

        <!-- 主题切换 - 移动端居中 -->
        <div
          class="flex justify-center mt-4 transition-all duration-500 delay-500"
          :class="isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        >
          <ThemeToggle />
        </div>
      </template>

      <!-- 桌面端：水平布局 -->
      <template v-else>
        <div class="flex items-center justify-between gap-4">
          <!-- Logo 和标题 -->
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

          <!-- 搜索框 -->
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
                @input="emit('search')"
              />
              <SearchIcon class="absolute left-4 top-1/2 -translate-y-1/2 text-white/80" />
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
      </template>
    </div>

    <!-- 波浪分隔 -->
    <WaveDivider :height="isMobile ? 'h-8' : 'h-10'" />
  </header>
</template>
