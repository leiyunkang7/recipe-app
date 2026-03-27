<script setup lang="ts">
/**
 * 应用顶层入口
 *
 * ErrorBoundary 包装 NuxtPage 以捕获渲染错误，
 * 防止单个页面的错误导致整个应用崩溃。
 */

// Note: useI18n is available globally via Nuxt i18n module
const errorBoundaryRef = ref()

// 暗色模式
const { isDark, init, toggle } = useDarkMode()

// 初始化暗色模式（在客户端挂载后）
onMounted(() => {
  init()
})

// 全局错误处理：记录未被组件捕获的错误
const handleGlobalError = (error: Error, errorInfo: { component: string; props: Record<string, unknown> }) => {
  // Error is handled by ErrorBoundary component
}

// 恢复处理
const handleRecovered = () => {
  // Recovery is handled by ErrorBoundary component
}

// 跳转到主内容区域
const skipToContent = () => {
  const main = document.getElementById('main-content')
  if (main) {
    main.focus()
    main.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />

    <!-- 跳过导航链接 - 仅键盘用户可见 -->
    <a
      href="#main-content"
      class="skip-link"
      @click.prevent="skipToContent"
    >
      跳转到主要内容
    </a>

    <!-- 离线状态提示 -->
    <OfflineBanner />

    <!-- 主题切换按钮 -->
    <button
      type="button"
      class="theme-toggle"
      :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
      @click="toggle"
    >
      <!-- Sun icon (shown in dark mode to switch to light) -->
      <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="theme-toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <!-- Moon icon (shown in light mode to switch to dark) -->
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="theme-toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>

    <!-- 全局 Toast 通知 -->
    <ToastContainer />

    <!-- 全局错误边界：保护整个应用免受渲染错误影响 -->
    <ErrorBoundary
      ref="errorBoundaryRef"
      :show-details="true"
      level="component"
      @error="handleGlobalError"
      @recovered="handleRecovered"
    >
      <div class="page-wrapper">
        <NuxtPage />
      </div>
    </ErrorBoundary>
  </div>
</template>

<style>
/* 跳过导航链接样式 */
.skip-link {
  position: fixed;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  padding: 12px 24px;
  background: #f97316;
  color: white;
  font-weight: 600;
  border-radius: 0 0 8px 8px;
  text-decoration: none;
  transition: top 0.2s ease;
}

.skip-link:focus {
  top: 0;
  outline: 2px solid #ea580c;
  outline-offset: 2px;
}

/* 全局焦点样式 */
:focus-visible {
  outline: 2px solid #f97316;
  outline-offset: 2px;
}

/* 主题切换按钮 */
.theme-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  background: var(--color-bg-paper);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px var(--color-shadow);
}

.theme-toggle:hover {
  background: var(--color-bg);
  transform: scale(1.05);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.theme-toggle-icon {
  color: var(--color-text-primary);
  transition: transform 0.2s ease;
}

.theme-toggle:hover .theme-toggle-icon {
  transform: rotate(15deg);
}

/* 页面过渡容器 */
.page-wrapper {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
