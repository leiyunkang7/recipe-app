<script setup lang="ts">
/**
 * AppImage - 优化的图片组件
 *
 * 特性：
 * - 基于 NuxtImg，支持懒加载、WebP/AVIF 格式
 * - 加载时显示 shimmer 占位符
 * - 加载失败时显示 emoji 备用图
 * - 支持响应式 sizes
 * - 正确处理浏览器缓存的图片（通过 img 元素的 complete 属性检测）
 */

interface Props {
  src: string
  alt: string
  sizes?: string
  quality?: number
  loading?: 'lazy' | 'eager'
  fetchpriority?: 'low' | 'medium' | 'high'
  placeholder?: boolean
  fallbackEmoji?: string
  objectFit?: 'cover' | 'contain' | 'fill'
}

const props = withDefaults(defineProps<Props>(), {
  sizes: 'sm:100vw md:50vw lg:400px',
  quality: 80,
  loading: 'lazy',
  fetchpriority: 'medium',
  placeholder: true,
  fallbackEmoji: '🍽️',
  objectFit: 'cover',
})

const isLoaded = ref(false)
const hasError = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)

const onLoad = () => {
  isLoaded.value = true
}

const onError = () => {
  hasError.value = true
}

// 检测图片是否已加载（处理浏览器缓存情况）
onMounted(() => {
  if (imgRef.value?.complete) {
    isLoaded.value = true
  }
})
</script>

<template>
  <div class="app-image-wrapper relative overflow-hidden">
    <!-- 错误状态 - 优先级最高 -->
    <div
      v-if="hasError"
      class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600"
    >
      <span class="text-4xl">{{ fallbackEmoji }}</span>
    </div>

    <!-- NuxtImg - 有图片时显示 -->
    <NuxtImg
      v-else-if="src"
      ref="imgRef"
      :src="src"
      :alt="alt"
      :sizes="sizes"
      :quality="quality"
      :loading="loading"
      :fetchpriority="fetchpriority"
      format="auto"
      decoding="async"
      class="w-full h-full transition-opacity duration-300"
      :class="{ 'opacity-0': !isLoaded, 'object-cover': objectFit === 'cover', 'object-contain': objectFit === 'contain', 'object-fill': objectFit === 'fill' }"
      @load="onLoad"
      @error="onError"
    />

    <!-- 无图片时的默认占位符 -->
    <div
      v-else
      class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600"
    >
      <span class="text-4xl">{{ fallbackEmoji }}</span>
    </div>

    <!-- Shimmer 占位符 - 图片加载中显示 -->
    <div
      v-if="placeholder && !isLoaded && !hasError && src"
      class="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600"
    >
      <div class="shimmer-animation absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
    </div>
  </div>
</template>

<style scoped>
.app-image-wrapper {
  width: 100%;
  height: 100%;
}

.shimmer-animation {
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .shimmer-animation {
    animation: none;
  }
}
</style>
