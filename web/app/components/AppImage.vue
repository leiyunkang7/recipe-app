<script setup lang="ts">
/**
 * AppImage - 优化的图片组件
 *
 * 特性：
 * - 基于 NuxtImg，支持懒加载、WebP/AVIF 格式
 * - 加载时显示 shimmer 占位符
 * - 加载失败时显示 emoji 备用图
 * - 支持响应式 sizes
 */

interface Props {
  src: string
  alt: string
  sizes?: string
  quality?: number
  loading?: 'lazy' | 'eager'
  placeholder?: boolean
  fallbackEmoji?: string
  objectFit?: 'cover' | 'contain' | 'fill'
}

const props = withDefaults(defineProps<Props>(), {
  sizes: 'sm:100vw md:50vw lg:400px',
  quality: 80,
  loading: 'lazy',
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

// 监听图片加载完成
onMounted(() => {
  if (imgRef.value?.complete) {
    isLoaded.value = true
  }
})
</script>

<template>
  <div class="app-image-wrapper relative overflow-hidden" :class="[`object-${objectFit}`]">
    <!-- Shimmer 占位符 -->
    <div
      v-if="placeholder && !isLoaded && !hasError"
      class="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600"
    >
      <div class="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
    </div>

    <!-- 错误状态 -->
    <div
      v-if="hasError"
      class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600"
    >
      <span class="text-4xl">{{ fallbackEmoji }}</span>
    </div>

    <!-- NuxtImg -->
    <NuxtImg
      v-if="src && !hasError"
      ref="imgRef"
      :src="src"
      :alt="alt"
      :sizes="sizes"
      :quality="quality"
      :loading="loading"
      format="auto"
      decoding="async"
      class="w-full h-full transition-opacity duration-300"
      :class="{ 'opacity-0': !isLoaded, [`object-${objectFit}`]: true }"
      @load="onLoad"
      @error="onError"
    />
  </div>
</template>

<style scoped>
.app-image-wrapper {
  width: 100%;
  height: 100%;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-\[shimmer_1\.5s_infinite\] {
    animation: none;
  }
}
</style>
