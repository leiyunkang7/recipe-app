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

// 阅读模式 & 护眼模式
const { bodyClasses } = useReadingMode()

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

// PWA meta tags
useHead({
  meta: [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'application-name', content: '食谱大全' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: '食谱大全' },
  ],
  link: [
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/icon.png' },
  ],
})
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

    <!-- 语言切换 -->
    <LanguageSwitcher class="fixed top-36 right-4 z-50" />

    <!-- 全局 Toast 通知 -->
    <ToastContainer />

    <!-- WebSocket 实时通知 Toast -->
    <WebSocketNotificationToast />

    <!-- 全局错误边界：保护整个应用免受渲染错误影响 -->
    <ErrorBoundary
      ref="errorBoundaryRef"
      :show-details="true"
      level="component"
      @error="handleGlobalError"
      @recovered="handleRecovered"
    >
      <div class="page-wrapper" :class="bodyClasses">
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

/* ============================================================
   阅读模式 (Reading Mode) - 隐藏导航，增大字号
   ============================================================ */

/* 隐藏顶部导航栏 */
.reading-mode-active :global(.desktop-navbar),
.reading-mode-active :global(.mobile-navbar) {
  display: none !important;
}

/* 隐藏底部导航栏 */
.reading-mode-active :global(.bottom-nav),
.reading-mode-active :global(.mobile-bottom-nav) {
  display: none !important;
}

/* 隐藏英雄区域装饰 */
.reading-mode-active :global(.hero-section),
.reading-mode-active :global(.wave-divider) {
  display: none !important;
}

/* 隐藏横幅和广告 */
.reading-mode-active :global(.banner),
.reading-mode-active :global(.promo-banner) {
  display: none !important;
}

/* 隐藏分享按钮、收藏按钮等次要操作 */
.reading-mode-active :global(.action-bar),
.reading-mode-active :global(.batch-action-bar) {
  display: none !important;
}

/* 阅读模式内容：增大字号 */
.reading-mode-active :global(body) {
  font-size: 1.125rem;
}

.reading-mode-active :global(.text-base) {
  font-size: 1.0625rem !important;
}

.reading-mode-active :global(.text-lg) {
  font-size: 1.25rem !important;
}

.reading-mode-active :global(.text-xl) {
  font-size: 1.375rem !important;
}

.reading-mode-active :global(.text-2xl) {
  font-size: 1.625rem !important;
}

.reading-mode-active :global(.text-3xl) {
  font-size: 1.875rem !important;
}

.reading-mode-active :global(p),
.reading-mode-active :global(.prose) {
  line-height: 1.9 !important;
}

/* ============================================================
   护眼模式 (Eye Protection Mode) - 暖色调，降低蓝光
   ============================================================ */

/* 全局暖色背景（浅色模式） */
.eye-protection-active :global(body) {
  background-color: #fef3e2 !important;
}

.eye-protection-active :global(html) {
  background-color: #fef3e2 !important;
}

/* 暖色背景（浅色模式下所有主要容器） */
.eye-protection-active :global(.bg-white) {
  background-color: #fff8f0 !important;
}

.eye-protection-active :global(.bg-stone-50) {
  background-color: #fef9f0 !important;
}

.eye-protection-active :global(.bg-orange-50) {
  background-color: #fff7ed !important;
}

/* 护眼模式卡片背景 */
.eye-protection-active :global(.bg-white\/\/,.bg-white\/80,.bg-white\/60) {
  background-color: #fff8f0ee !important;
}

/* 护眼模式深色模式 */
html.dark .eye-protection-active :global(body) {
  background-color: #451a03 !important;
}

html.dark .eye-protection-active :global(html) {
  background-color: #451a03 !important;
}

html.dark .eye-protection-active :global(.bg-stone-900) {
  background-color: #431d03 !important;
}

html.dark .eye-protection-active :global(.bg-stone-800) {
  background-color: #78350f !important;
}

html.dark .eye-protection-active :global(.bg-stone-700) {
  background-color: #92400e !important;
}

html.dark .eye-protection-active :global(.bg-stone-950) {
  background-color: #3b1500 !important;
}

/* ============================================================
   减少动画偏好 */
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
