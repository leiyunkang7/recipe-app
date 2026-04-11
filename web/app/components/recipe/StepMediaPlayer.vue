<script setup lang="ts">
/**
 * StepMediaPlayer - Media player for recipe step illustrations
 * Supports image, GIF, and video content with auto-play controls
 */
import type { StepMediaType } from '~/types'

interface Props {
  /** URL of the media content */
  mediaUrl?: string
  /** Type of media: 'image' | 'gif' | 'video' */
  mediaType?: StepMediaType
  /** Alt text for the media */
  alt?: string
  /** CSS size class for the container */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Whether to auto-play video/GIF */
  autoPlay?: boolean
  /** Whether to loop video/GIF */
  loop?: boolean
  /** Whether to mute video audio */
  muted?: boolean
  /** Show playback controls for video */
  controls?: boolean
  /** Step number for fallback illustration */
  stepNumber?: number
  /** Instruction text for illustration fallback */
  instruction?: string
  /** Total steps for illustration */
  totalSteps?: number
  /** CSS classes to apply to container */
  containerClass?: string
  /** Lazy load the media */
  loading?: 'lazy' | 'eager'
}

const props = withDefaults(defineProps<Props>(), {
  mediaType: 'image',
  alt: '',
  size: 'md',
  autoPlay: true,
  loop: true,
  muted: true,
  controls: false,
  stepNumber: 1,
  instruction: '',
  totalSteps: 1,
  containerClass: '',
  loading: 'lazy',
})

const emit = defineEmits<{
  play: []
  pause: []
  ended: []
  error: [error: Error]
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const isLoaded = ref(false)
const hasError = ref(false)
const showFallback = ref(false)
const isHovered = ref(false)

// Determine media type from URL if not explicitly provided
const resolvedMediaType = computed<StepMediaType>(() => {
  if (props.mediaType && props.mediaType !== 'image') return props.mediaType
  if (!props.mediaUrl) return 'image'

  const url = props.mediaUrl.toLowerCase()
  if (url.endsWith('.gif') || url.includes('format=gif') || url.includes('gif=true')) return 'gif'
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/.test(url) || url.includes('video=true') || url.includes('/video')) return 'video'
  return 'image'
})

// Size classes mapping
const sizeClasses = computed(() => {
  const map = {
    sm: 'h-32 max-h-32',
    md: 'h-48 max-h-48',
    lg: 'h-64 max-h-64',
    xl: 'h-80 max-h-80',
  }
  return map[props.size] ?? map.md
})

const roundedClass = computed(() => {
  return props.size === 'sm' ? 'rounded-lg' : 'rounded-xl'
})

// Video control methods
const play = async () => {
  if (videoRef.value && resolvedMediaType.value === 'video') {
    try {
      await videoRef.value.play()
      isPlaying.value = true
      emit('play')
    } catch (err) {
      emit('error', err as Error)
    }
  }
}

const pause = () => {
  if (videoRef.value && resolvedMediaType.value === 'video') {
    videoRef.value.pause()
    isPlaying.value = false
    emit('pause')
  }
}

const togglePlay = () => {
  if (isPlaying.value) pause()
  else play()
}

// Use StepIllustration as fallback
const StepIllustration = defineAsyncComponent(() => import('~/components/recipe/StepIllustration.vue'))

// Auto-play GIFs and videos when visible
const mediaContainerRef = ref<HTMLElement | null>(null)
const { stop: stopIntersectionObserver } = useIntersectionObserver(
  mediaContainerRef,
  ([entry]) => {
    if (entry?.isIntersecting && resolvedMediaType.value !== 'image') {
      // Auto-play when scrolled into view
      if (resolvedMediaType.value === 'video' && props.autoPlay) {
        play()
      }
    }
  },
  { threshold: 0.3 }
)

onUnmounted(() => {
  stopIntersectionObserver()
})
</script>

<template>
  <div
    ref="mediaContainerRef"
    class="step-media-player relative overflow-hidden bg-stone-100 dark:bg-stone-900/50 flex items-center justify-center"
    :class="[sizeClasses, roundedClass, containerClass]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Loading skeleton -->
    <div
      v-if="!isLoaded && !hasError && mediaUrl"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Error state -->
    <div
      v-else-if="hasError || showFallback || !mediaUrl"
      class="w-full h-full flex items-center justify-center"
    >
      <StepIllustration
        v-if="!mediaUrl || showFallback"
        :step-number="stepNumber"
        :total-steps="totalSteps"
        :has-image="false"
        :size="size === 'sm' ? 'sm' : size === 'lg' || size === 'xl' ? 'lg' : 'md'"
        :instruction="instruction"
      />
      <div v-else-if="hasError" class="text-center text-stone-400">
        <svg class="w-10 h-10 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-xs">{{ $t('recipe.mediaLoadError') || 'Failed to load' }}</p>
      </div>
    </div>

    <!-- Static Image -->
    <template v-else-if="resolvedMediaType === 'image'">
      <AppImage
        :src="mediaUrl"
        :alt="alt"
        class="w-full h-full transition-transform duration-300"
        :class="isHovered ? 'scale-[1.02]' : 'scale-100'"
        :loading="loading"
        object-fit="cover"
        @load="isLoaded = true"
        @error="hasError = true"
      />
    </template>

    <!-- GIF -->
    <template v-else-if="resolvedMediaType === 'gif'">
      <img
        :src="mediaUrl"
        :alt="alt"
        class="w-full h-full object-cover transition-transform duration-300"
        :class="isHovered ? 'scale-[1.02]' : 'scale-100'"
        :loading="loading"
        @load="isLoaded = true"
        @error="hasError = true"
      />
      <!-- GIF playback indicator -->
      <div class="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
        <span class="font-bold">GIF</span>
      </div>
    </template>

    <!-- Video -->
    <template v-else-if="resolvedMediaType === 'video'">
      <video
        ref="videoRef"
        :src="mediaUrl"
        :autoplay="autoPlay && !isHovered"
        :loop="loop"
        :muted="muted"
        :controls="controls || isHovered"
        :playsinline="true"
        class="w-full h-full object-cover transition-transform duration-300"
        :class="isHovered ? 'scale-[1.02]' : 'scale-100'"
        @canplay="isLoaded = true"
        @error="hasError = true"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @ended="emit('ended')"
      />
      <!-- Video badge -->
      <div class="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
        <span class="font-bold">VIDEO</span>
      </div>
      <!-- Hover play/pause overlay for video -->
      <div
        v-if="isHovered && !controls"
        class="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
        @click="togglePlay"
      >
        <div class="w-14 h-14 rounded-full bg-white/90 dark:bg-stone-800/90 flex items-center justify-center shadow-lg backdrop-blur-sm transition-transform hover:scale-110">
          <svg v-if="!isPlaying" class="w-6 h-6 text-orange-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
          <svg v-else class="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
          </svg>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.step-media-player {
  contain: layout style;
}

@media (prefers-reduced-motion: reduce) {
  .step-media-player * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
