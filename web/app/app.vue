<script setup lang="ts">
/**
 * 应用顶层入口
 *
 * ErrorBoundary 包装 NuxtPage 以捕获渲染错误，
 * 防止单个页面的错误导致整个应用崩溃。
 */

// Note: useI18n is available globally via Nuxt i18n module
const errorBoundaryRef = ref()

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
      <NuxtPage />
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
