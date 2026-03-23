<script setup lang="ts">
const { t } = useI18n()

const searchQuery = defineModel<string>('searchQuery', { default: '' })

const emit = defineEmits<{
  search: []
}>()

const handleSearch = () => {
  emit('search')
}
</script>

<template>
  <!-- 移动端 Hero 头部 -->
  <header class="md:hidden relative overflow-hidden">
    <!-- 渐变背景 + 动态光效 -->
    <div class="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500"></div>
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-1/2 -left-1/4 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse" style="animation-delay: 1s;"></div>
    </div>

    <!-- 玻璃态内容 -->
    <div class="relative px-6 py-8">
      <div class="text-center mb-6">
        <div class="text-4xl sm:text-5xl mb-3 animate-bounce" style="animation-duration: 3s;">🍳</div>
        <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
          {{ t('app.title') }}
        </h1>
        <p class="text-orange-100 text-xs sm:text-sm mb-4 opacity-90">
          {{ t('app.subtitle') }}
        </p>
      </div>

      <!-- 搜索框 - 玻璃态 -->
      <div class="relative">
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
      <div class="flex justify-center mt-4">
        <ThemeToggle />
      </div>
    </div>

    <!-- 波浪分隔 -->
    <div class="absolute bottom-0 left-0 right-0">
      <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" class="w-full h-8">
        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#fafaf9"/>
        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" class="dark:fill-stone-800" style="transform: translateY(-4px);"/>
      </svg>
    </div>
  </header>
</template>
