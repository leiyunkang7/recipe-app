<script setup lang="ts">
/**
 * BottomSheet - 移动端底部抽屉组件
 *
 * 特性：
 * - 移动端从底部滑出，桌面端居中显示
 * - 支持 swipe-to-dismiss 手势（带速度和距离检测）
 * - 点击遮罩关闭
 * - ESC 键关闭
 * - 暗色模式支持
 * - 入场/退场动画
 * - 拖动时背景透明度动态变化
 * - 拖动时有弹性效果
 * - 使用 useSwipeGesture composable 统一手势处理
 */

import { useSwipeGesture } from "~/composables/useSwipeGesture"

interface Props {
  visible: boolean
  title?: string
  /** 是否显示顶部拖动条 */
  showHandle?: boolean
  /** 允许的最大高度（默认 85vh） */
  maxHeight?: string
  /** 是否可拖动关闭（移动端） */
  swipeable?: boolean
  /** 关闭的 swipe 阈值（像素） */
  swipeThreshold?: number
  /** 关闭的速度阈值（px/s） */
  velocityThreshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  showHandle: true,
  maxHeight: "85vh",
  swipeable: true,
  swipeThreshold: 80,
  velocityThreshold: 500,
})

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

// Refs
const sheetRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

// Animation state
const isVisible = ref(false)
const isAnimating = ref(false)
const translateY = ref(0)
const isDragging = ref(false)

// Touch state tracking for backdrop opacity
const touchStartY = ref(0)

// Backdrop opacity based on drag distance
const backdropOpacity = computed(() => {
  if (isDragging.value && translateY.value > 0) {
    const ratio = Math.min(translateY.value / 300, 1)
    return 0.5 * (1 - ratio * 0.5)
  }
  return 0.5
})

// Handle ESC key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault()
    close()
  }
}

// Close the sheet
const close = () => {
  if (isAnimating.value) return
  isAnimating.value = true
  isVisible.value = false
  setTimeout(() => {
    emit("close")
    isAnimating.value = false
  }, 300)
}

// Open animation
watch(() => props.visible, (visible) => {
  if (visible) {
    isAnimating.value = true
    isVisible.value = true
    nextTick(() => {
      isAnimating.value = false
    })
    // Lock body scroll
    document.body.style.overflow = "hidden"
  } else {
    document.body.style.overflow = ""
  }
}, { immediate: true })

// Apply rubber-band resistance to drag distance
const getRubberBandedDelta = (delta: number): number => {
  if (delta <= 0) return delta
  // Resistance factor - higher = more resistance
  const resistance = 0.5
  // Rubber-band formula: apply progressive resistance
  return delta * (1 - Math.min(delta / (delta + 200), resistance))
}

// Use swipe gesture composable for vertical swipe-to-dismiss
useSwipeGesture(
  sheetRef,
  {
    horizontal: false,
    vertical: true,
    threshold: props.swipeThreshold,
    maxDuration: 1000,
    preventScroll: false,
    hapticFeedback: true,
    onSwipeStart: () => {
      isDragging.value = true
      touchStartY.value = 0
    },
    onSwipeMove: (state) => {
      // Only allow downward swipe (positive distanceY = downward)
      if (state.distanceY > 0) {
        translateY.value = getRubberBandedDelta(state.distanceY)
      }
    },
    onSwipeEnd: (state, direction) => {
      isDragging.value = false

      // Check if should close based on distance or velocity
      // velocityY is in px/ms, convert to px/s by multiplying by 1000
      const velocityPxS = Math.abs(state.velocityY) * 1000
      const shouldClose = velocityPxS > props.velocityThreshold ||
        state.distanceY > props.swipeThreshold

      if (shouldClose && direction.primary === "down") {
        close()
      } else {
        // Spring back
        translateY.value = 0
      }
    },
    onSwipeCancel: () => {
      isDragging.value = false
      translateY.value = 0
    },
  },
  {
    horizontal: false,
    vertical: true,
    threshold: props.swipeThreshold,
  }
)

// Click outside to close (mouse + touch for mobile)
const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
  if (props.visible && !isAnimating.value && sheetRef.value) {
    const target = event.target as Node
    if (!sheetRef.value.contains(target)) {
      close()
    }
  }
}

onMounted(() => {
  document.addEventListener("click", handleOutsideClick, true)
  document.addEventListener("touchstart", handleOutsideClick, true)
})

onUnmounted(() => {
  document.removeEventListener("click", handleOutsideClick, true)
  document.removeEventListener("touchstart", handleOutsideClick, true)
  document.body.style.overflow = ""
})

// Prevent scroll when sheet is open
watch(() => props.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      contentRef.value?.addEventListener("touchmove", preventScroll, { passive: false })
    })
  } else {
    contentRef.value?.removeEventListener("touchmove", preventScroll)
  }
})

const preventScroll = (e: TouchEvent) => {
  if (isDragging.value) {
    e.preventDefault()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      leave-active-class="transition-opacity duration-200 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        role="dialog"
        aria-modal="true"
        @keydown="handleKeyDown"
      >
        <!-- 背景遮罩 -->
        <div
          class="absolute inset-0 backdrop-blur-sm transition-opacity duration-200"
          :class="isDragging ? 'duration-0' : ''"
          :style="{ backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` }"
          role="button"
          tabindex="0"
          :aria-label="t('common.close')"
          @keydown.enter="close"
          @keydown.space.prevent="close"
          @click="close"
        />

        <!-- Sheet 内容 -->
        <div
          ref="sheetRef"
          class="relative w-full sm:max-w-lg bg-white dark:bg-stone-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          :class="[
            'transition-transform duration-300',
            'sm:transition-all sm:duration-300 sm:ease-out',
            isDragging ? '' : 'sm:translate-y-0',
          ]"
          :style="{
            maxHeight: maxHeight,
            transform: `translateY(${translateY}px)`,
          }"
        >
          <!-- 顶部拖动条 -->
          <div
            v-if="showHandle"
            class="flex justify-center pt-3 pb-2 shrink-0"
          >
            <div class="w-10 h-1 bg-gray-300 dark:bg-stone-600 rounded-full" />
          </div>

          <!-- 标题栏 -->
          <div
            v-if="title || $slots.header"
            class="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-stone-700 shrink-0"
          >
            <slot name="header">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ title }}
              </h2>
            </slot>
            <button
              @click="close"
              class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
              :aria-label="t('common.close')"
            >
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 内容区域 -->
          <div
            ref="contentRef"
            class="flex-1 overflow-y-auto p-6"
          >
            <slot />
          </div>

          <!-- 底部插槽 -->
          <div
            v-if="$slots.footer"
            class="px-6 py-4 border-t border-gray-100 dark:border-stone-700 bg-gray-50/50 dark:bg-stone-800/50 shrink-0"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
