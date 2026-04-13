<script setup lang="ts">
/**
 * BottomSheet - 移动端底部抽屉组件
 *
 * 特性：
 * - 移动端从底部滑出，桌面端居中显示
 * - 支持 swipe-to-dismiss 手势（带速度和距离检测）
 * - 弹性拖拽 + 橡皮筋阻力
 * - 中间/顶部 Snap Points（25%/50%/85% 高度档位）
 * - 物理弹簧回弹动画
 * - 点击遮罩关闭、ESC 键关闭
 * - 暗色模式支持
 * - 入场/退场动画 + 拖拽时背景透明度动态变化
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
  /** Snap Points 高度档位（vh），默认 [25, 50, 85] */
  snapPoints?: number[]
  /** 默认 snap 点（索引，0=第一档），默认最后一档 */
  defaultSnapIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  showHandle: true,
  maxHeight: "85vh",
  swipeable: true,
  swipeThreshold: 80,
  velocityThreshold: 500,
  snapPoints: () => [25, 50, 85],
  defaultSnapIndex: -1,
})

const emit = defineEmits<{
  close: []
  snap: [index: number]
}>()

const { t } = useI18n()

// Refs
const sheetRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

// ─── Animation state ────────────────────────────────────────────────
const isVisible = ref(false)
const isAnimating = ref(false)
const isDragging = ref(false)

// 拖拽偏移（正值=向下，0=完全展开）
const translateY = ref(0)

// 当前 snap 索引（-1=完全展开，0=第一档…）
const currentSnapIndex = ref(-1)

// 计算 snap 点像素值（基于视口）
const snapPixels = computed(() =>
  props.snapPoints.map((p) => (p / 100) * window.innerHeight)
)

// 完全展开时 translateY=0；snap 点 translateY>0（被向上推）
const getSnapTranslateY = (index: number) => {
  if (index < 0 || index >= snapPixels.value.length) return 0
  const full = snapPixels.value[props.snapPoints.length - 1] ?? 0 // 85vh = 完全展开位置
  return (full ?? 0) - (snapPixels.value[index] ?? 0)
}

// ─── Backdrop opacity ────────────────────────────────────────────────
const backdropOpacity = computed(() => {
  if (isDragging.value && translateY.value > 0) {
    const ratio = Math.min(translateY.value / 300, 1)
    return 0.5 * (1 - ratio * 0.5)
  }
  return 0.5
})

// ─── Snap helpers ───────────────────────────────────────────────────
const findNearestSnap = (deltaY: number): number => {
  // deltaY > 0 → 向下滑（关闭方向），snap 索引应该更小
  // deltaY < 0 → 向上滑（展开方向），snap 索引应该更大
  const fullHeightRaw = snapPixels.value[props.snapPoints.length - 1]
  if (fullHeightRaw === undefined || fullHeightRaw === 0) return -1
  const fullHeight = fullHeightRaw

  // 当前 translateY 表示 sheet 被向下推了多少
  const absY = Math.abs(deltaY)
  const maxDelta = fullHeight

  if (absY < 20) return props.defaultSnapIndex < 0 ? -1 : props.defaultSnapIndex

  // 计算应到达的"展开比例"
  const expandRatio = 1 - Math.min(maxDelta ? absY / maxDelta : 1, 1)

  // 找到最近的 snap 点
  let nearest = 0
  let minDist = Infinity
  for (let i = 0; i < props.snapPoints.length; i++) {
    const snapPoint = props.snapPoints[i]
    if (snapPoint === undefined) continue
    const targetRatio = snapPoint / 100
    const dist = Math.abs(targetRatio - expandRatio)
    if (dist < minDist) {
      minDist = dist
      nearest = i
    }
  }
  return nearest
}

// ─── Rubber-band resistance ─────────────────────────────────────────
const getRubberBandedDelta = (delta: number): number => {
  if (delta <= 0) return delta
  const resistance = 0.5
  return delta * (1 - Math.min(delta / (delta + 200), resistance))
}

// ─── Spring animation (CSS cubic-bezier approximation) ───────────────
const springBack = () => {
  if (!sheetRef.value) return
  sheetRef.value.style.transition =
    "transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)"
  translateY.value = 0
  currentSnapIndex.value = -1
  setTimeout(() => {
    if (sheetRef.value) {
      sheetRef.value.style.transition = ""
    }
  }, 420)
}

const snapTo = (index: number) => {
  currentSnapIndex.value = index
  translateY.value = getSnapTranslateY(index)
  emit("snap", index)
}

// ─── Close ─────────────────────────────────────────────────────────
const close = () => {
  if (isAnimating.value) return
  isAnimating.value = true
  isVisible.value = false
  translateY.value = 0
  currentSnapIndex.value = -1
  setTimeout(() => {
    emit("close")
    isAnimating.value = false
  }, 300)
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault()
    close()
  }
}

// ─── Visibility watch ───────────────────────────────────────────────
watch(() => props.visible, (visible) => {
  if (visible) {
    isAnimating.value = true
    isVisible.value = true
    nextTick(() => {
      isAnimating.value = false
      // 设置初始 snap 位置
      const startSnap = props.defaultSnapIndex < 0
        ? props.snapPoints.length - 1
        : props.defaultSnapIndex
      if (startSnap > 0) {
        translateY.value = getSnapTranslateY(startSnap)
        currentSnapIndex.value = startSnap
      }
    })
    document.body.style.overflow = "hidden"
  } else {
    document.body.style.overflow = ""
  }
}, { immediate: true })

// ─── Swipe gesture ─────────────────────────────────────────────────
useSwipeGesture(
  sheetRef as Ref<HTMLElement | null>,
  {
    onSwipeStart: () => {
      isDragging.value = true
    },
    onSwipeMove: (state) => {
      // 只允许向下滑动来关闭或降低 snap 点
      if (state.distanceY > 0) {
        translateY.value = getRubberBandedDelta(state.distanceY)
      } else {
        // 向上滑时轻微抵抗，不超过最小 snap
        translateY.value = Math.max(state.distanceY, getSnapTranslateY(props.snapPoints.length - 1))
      }
    },
    onSwipeEnd: (state, direction) => {
      isDragging.value = false
      const velocityPxS = Math.abs(state.velocityY) * 1000

      // 快速下滑 → 关闭
      if (velocityPxS > props.velocityThreshold && state.distanceY > 20) {
        close()
        return
      }

      // 根据滑动距离找到最近的 snap 点
      const nearest = findNearestSnap(translateY.value)

      // 距离过大 → 关闭
      if (state.distanceY > props.swipeThreshold) {
        close()
        return
      }

      // 否则 snap 到最近位置并带回弹动画
      if (nearest >= 0 && nearest < props.snapPoints.length) {
        snapTo(nearest)
      } else {
        springBack()
      }
    },
    onSwipeCancel: () => {
      isDragging.value = false
      springBack()
    },
  },
  {
    horizontal: false,
    vertical: true,
    threshold: props.swipeThreshold,
    maxDuration: 1000,
    preventScroll: false,
    hapticFeedback: true,
  }
)

// ─── Touch outside to close ────────────────────────────────────────
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

// ─── Scroll lock on content ─────────────────────────────────────────
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
          class="absolute inset-0 backdrop-blur-sm"
          :class="isDragging ? 'transition-none' : 'transition-opacity duration-200'"
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
          :style="{
            maxHeight: maxHeight,
            transform: `translateY(${translateY}px)`,
          }"
        >
          <!-- 顶部拖动条（点击可切换 snap 点） -->
          <button
            v-if="showHandle"
            class="flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing select-none"
            :aria-label="t('bottomSheet.toggleSnap') || '调整高度'"
            @click="() => {
              const next = currentSnapIndex <= 0
                ? props.snapPoints.length - 1
                : currentSnapIndex - 1
              snapTo(next)
            }"
          >
            <div class="w-10 h-1 bg-gray-300 dark:bg-stone-600 rounded-full" />
          </button>

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

          <!-- Snap 指示器（移动端） -->
          <div
            v-if="swipeable && snapPoints.length > 1"
            class="flex justify-center gap-1.5 pb-2 shrink-0 sm:hidden"
          >
            <div
              v-for="(point, i) in snapPoints"
              :key="i"
              class="w-1.5 h-1.5 rounded-full transition-all duration-200"
              :class="currentSnapIndex === i
                ? 'bg-orange-500 w-4'
                : 'bg-gray-300 dark:bg-stone-600'"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
