<script setup lang="ts">
/**
 * AppImage - 优化的图片组件
 *
 * 特性：
 * - 支持预生成的响应式 srcset（上传图片使用 sharp 生成的高质量变体）
 * - 使用原生 <picture> 元素实现 WebP/AVIF 格式切换
 * - 加载时显示 shimmer 占位符
 * - 加载失败时显示图标备用图
 * - 支持响应式 sizes
 * - 正确处理浏览器缓存的图片（通过 img 元素的 complete 属性检测）
 * - 外部图片降级到 NuxtPicture 自动处理
 */
import PlateIcon from '~/components/icons/PlateIcon.vue'

interface ResponsiveSrcset {
  avif: string
  webp: string
}

interface Props {
  src: string
  alt: string
  sizes?: string
  quality?: number
  loading?: 'lazy' | 'eager'
  fetchpriority?: 'low' | 'medium' | 'high'
  placeholder?: boolean
  objectFit?: 'cover' | 'contain' | 'fill'
  /** 预生成的响应式 srcset（来自上传 API） */
  srcset?: ResponsiveSrcset
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

// 是否有图片源
const hasImage = computed(() => !!props.src)

// 是否有预生成的 srcset（本地上传图片）
const hasPreGeneratedSrcset = computed(() => !!props.srcset?.avif && !!props.srcset?.webp)

// 构建 img 标签的 class
const imgClass = computed(() =>
  `w-full h-full transition-opacity duration-300 ${isLoaded.value ? '' : 'opacity-0'}`
)
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

    <!-- 使用预生成的 srcset（本地图片 - 来自上传 API） -->
    <picture v-else-if="hasImage && hasPreGeneratedSrcset">
      <!-- AVIF 源 - 最佳压缩比 -->
      <source
        type="image/avif"
        :srcset="srcset!.avif"
        :sizes="sizes"
      />
      <!-- WebP 源 - 兼容性降级 -->
      <source
        type="image/webp"
        :srcset="srcset!.webp"
        :sizes="sizes"
      />
      <!-- 降级到原始格式（使用 AVIF URL 作为 src） -->
      <img
        ref="imgRef"
        :src="src"
        :alt="alt"
        :loading="loading"
        :fetchpriority="fetchpriority"
        :class="imgClass"
        :style="{ objectFit: objectFit }"
        decoding="async"
        @load="onLoad"
        @error="onError"
      />
    </picture>

    <!-- NuxtPicture - 用于外部图片或无预生成 srcset 的情况 -->
    <NuxtPicture
      v-else-if="hasImage"
      ref="imgRef"
      :src="src"
      :alt="alt"
      :sizes="sizes"
      :quality="quality"
      :loading="loading"
      :fetchpriority="fetchpriority"
      :fit="objectFit"
      format="auto"
      :img-attrs="{ class: imgClass, style: { objectFit: objectFit } }"
      decoding="async"
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
      v-if="placeholder && !isLoaded && !hasError && hasImage"
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
