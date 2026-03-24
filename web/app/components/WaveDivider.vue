<script setup lang="ts">
/**
 * WaveDivider - 统一的波浪分隔组件
 *
 * 特性：
 * - 消除 HeroSection 中的代码重复
 * - 支持高度和颜色定制
 * - 暗黑模式支持
 */

interface Props {
  height?: string
  fillColor?: string
  darkFillColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: 'h-8',
  fillColor: '#fafaf9',
  darkFillColor: '#292524',
})
</script>

<template>
  <div class="absolute bottom-0 left-0 right-0">
    <svg
      viewBox="0 0 1440 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      class="w-full"
      :class="height"
    >
      <!-- Light mode wave -->
      <path
        d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
        :fill="fillColor"
      />
      <!-- Dark mode wave (offset by 4px for visual depth) -->
      <path
        d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
        :fill="darkFillColor"
        style="transform: translateY(-4px);"
      />
    </svg>
  </div>
</template>
