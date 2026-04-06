<script setup lang="ts">
/**
 * 应用顶层入口
 *
 * ErrorBoundary 包装 NuxtPage 以捕获渲染错误，
 * 防止单个页面的错误导致整个应用崩溃。
 */

const { t } = useI18n()
const errorBoundaryRef = ref()

// 主题管理 - 使用统一的 useTheme composable
const { init: initTheme } = useTheme()

// 温度单位管理
const { init: initTempUnit } = useTemperatureUnit()

// 初始化主题和温度单位（在客户端挂载后）
onMounted(() => {
  initTheme()
  initTempUnit()
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
      {{ t('app.skipToContent') }}
    </a>

    <!-- 离线状态提示 -->
    <OfflineBanner />

    <!-- 主题切换按钮 -->
    <ThemeToggle class="fixed top-4 right-4 z-50" />

    <!-- 温度单位切换 -->
    <TemperatureUnitToggle class="fixed top-20 right-4 z-50" />

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

/* 页面过渡容器 */
.page-wrapper {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
}

/* 页面过渡动画 - 淡入淡出 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease;
  will-change: opacity;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

.page-enter-to,
.page-leave-from {
  opacity: 1;
}

/* iOS 键盘修复：使用 dynamic viewport height */
html {
  height: -webkit-fill-available;
}

/* iOS 输入框聚焦时滚动padding */
input:focus {
  scroll-padding-top: env(safe-area-inset-top, 0px);
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
