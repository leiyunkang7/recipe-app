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
  console.error('[App] Unhandled error caught by ErrorBoundary:', error)
  console.error('[App] Error component:', errorInfo.component)
}

// 恢复处理
const handleRecovered = () => {
  console.log('[App] ErrorBoundary recovered')
}
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    
    <!-- 离线状态提示 -->
    <OfflineBanner />
    
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
