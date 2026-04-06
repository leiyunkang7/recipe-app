<script setup lang="ts">
/**
 * AppImage - 优化的图片组件
 *
 * 特性：
 * - 基于 NuxtImg，支持懒加载、WebP/AVIF 格式
 * - 加载时显示 shimmer 占位符
 * - 加载失败时显示图标备用图
 * - 支持响应式 sizes
 * - 正确处理浏览器缓存的图片（通过 img 元素的 complete 属性检测）
 * - 支持 <picture> 元素，优先使用 AVIF，WebP 作为降级
 */
import PlateIcon from '~/components/icons/PlateIcon.vue'

interface Props {
  src: string
  alt: string
  sizes?: string
  quality?: number
  loading?: 'lazy' | 'eager'
  fetchpriority?: 'low' | 'medium' | 'high'
  placeholder?: boolean
  objectFit?: 'cover' | 'contain' | 'fill'
  /** WebP fallback URL (当使用 AVIF 源时) */
  fallbackUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  sizes: 'sm:100vw md:50vw lg:400px',
  quality: 80,
  loading: 'lazy',
  fetchpriority: 'medium',
  placeholder: true,
  objectFit: 'cover',
})

const isLoaded = ref(false)
const hasError = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)

// 虚拟滚动上下文中禁用骨架屏动画以提升性能
// provide/inject 在组件树中保持稳定，直接使用 inject 即可
const isInVirtualScroll = inject<boolean>('isVirtualScrolling', false)

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

// 是否使用 <picture> 元素（当有 fallbackUrl 时）
const usePicture = computed(() => !!props.fallbackUrl && props.src)
</script>

<template>
  <div class="app-image-wrapper relative overflow-hidden">
    <!-- 错误状态 - 优先级最高 -->
    <div
      v-if="hasError"
      class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600"
    >
      <PlateIcon class="w-12 h-12 text-gray-300 dark:text-stone-500" aria-hidden="true" />
    </div>

    <!-- 使用 <picture> 元素：AVIF 源 + WebP 降级 -->
    <picture v-else-if="usePicture" class="w-full h-full block">
      <!-- AVIF 源 (现代浏览器优先) -->
      <source
        :srcset="src"
        type="image/avif"
        :sizes="sizes"
      />
      <!-- WebP 降级 -->
      <source
        :srcset="fallbackUrl"
        type="image/webp"
        :sizes="sizes"
      />
      <!-- img 元素作为最后降级 -->
      <img
        ref="imgRef"
        :src="fallbackUrl"
        :alt="alt"
        :loading="loading"
        :fetchpriority="fetchpriority"
        :style="{ objectFit: objectFit }"
        decoding="async"
        class="w-full h-full transition-opacity duration-300"
        :class="{ 'opacity-0': !isLoaded }"
        @load="onLoad"
        @error="onError"
      />
    </picture>

    <!-- NuxtImg - 单图片源时使用 -->
    <NuxtImg
      v-else-if="src"
      ref="imgRef"
      :src="src"
      :alt="alt"
      :sizes="sizes"
      :quality="quality"
      :loading="loading"
      :fetchpriority="fetchpriority"
      :fit="objectFit"
      format="auto"
      decoding="async"
      class="w-full h-full transition-opacity duration-300"
      :class="{ 'opacity-0': !isLoaded }"
      @load="onLoad"
      @error="onError"
    />

    <!-- 无图片时的默认占位符 -->
    <div
      v-else
      class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600"
    >
      <PlateIcon class="w-12 h-12 text-gray-300 dark:text-stone-500" aria-hidden="true" />
    </div>

    <!-- Shimmer 占位符 - 图片加载中显示（虚拟滚动时禁用动画） -->
    <div
      v-if="placeholder && !isLoaded && !hasError && (src || usePicture)"
      class="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600"
    >
      <div
        class="shimmer-slide absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
        :class="{ 'animate-shimmer': !isInVirtualScroll }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.app-image-wrapper {
  width: 100%;
  height: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .animate-shimmer {
    animation: none;
  }
}
</style>
