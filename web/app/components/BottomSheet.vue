<script setup lang="ts">
/**
 * BottomSheet - 移动端底部抽屉组件 (v2)
 *
 * 三态支持：collapsed / half-open / expanded
 * - collapsed:   仅显示 handle，peek 高度（默认 80px）
 * - half-open:   半展开高度（默认 50vh）
 * - expanded:    全屏展开（默认 85vh，或内容自适应）
 *
 * 特性：
 * - 拖拽切换三种状态（向上滑展开，向下滑收起）
 * - 弹性 rubber-band 效果
 * - 速度检测：快速上滑/下滑切换状态
 * - 距离阈值判断状态切换
 * - 平滑 CSS 过渡动画
 * - 暗色模式支持
 * - 移动端触摸体验优化
 */

import { useSwipeGesture } from "~/composables/useSwipeGesture"

export type SheetState = "collapsed" | "half-open" | "expanded"

interface Props {
  /** 控制显示/隐藏 */
  visible: boolean
  /** 初始状态（visible=true 时的默认状态） */
  initialState?: SheetState
  /** 收起时露出的高度 */
  peekHeight?: number
  /** 半开高度 */
  halfOpenHeight?: string
  /** 最大高度 */
  maxHeight?: string
  /** 标题 */
  title?: string
  /** 是否显示顶部拖动条 */
  showHandle?: boolean
  /** 是否可拖动切换状态 */
  swipeable?: boolean
  /** 关闭的 swipe 距离阈值（px） */
  closeThreshold?: number
  /** 切换半开/展开的阈值（px） */
  expandThreshold?: number
  /** 速度阈值（px/s），超过则强制切换状态 */
  velocityThreshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialState: "half-open",
  peekHeight: 80,
  halfOpenHeight: "50vh",
  maxHeight: "90vh",
  showHandle: true,
  swipeable: true,
  closeThreshold: 100,
  expandThreshold: 80,
  velocityThreshold: 500,
})

const emit = defineEmits<{
  "update:visible": [value: boolean]
  "state-change": [state: SheetState]
  close: []
}>()

const { t } = useI18n()

// ─── Refs ────────────────────────────────────────────────────────────────────
const sheetRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

// ─── State ───────────────────────────────────────────────────────────────────
const isVisible = ref(false)
const isAnimating = ref(false)

// Drag state
const isDragging = ref(false)
const dragOffset = ref(0) // 正数=向下拽，负数=向上拽

// Current sheet state
const sheetState = ref<SheetState>(props.initialState)

// ─── Height 计算 ─────────────────────────────────────────────────────────────
const viewportHeight = ref(typeof window !== "undefined" ? window.innerHeight : 800)
const peekHeightPx = computed(() => props.peekHeight)
const halfOpenHeightPx = computed(() => {
  // 支持 vh 或 px
  const raw = props.halfOpenHeight
  if (raw.endsWith("vh")) {
    return (parseFloat(raw) / 100) * viewportHeight.value
  }
  return parseFloat(raw)
})
const maxHeightPx = computed(() => {
  const raw = props.maxHeight
  if (raw.endsWith("vh")) {
    return (parseFloat(raw) / 100) * viewportHeight.value
  }
  return parseFloat(raw)
})

// 各状态对应的 translateY（从底部向上偏移）
const stateToTranslateY = (state: SheetState): number => {
  switch (state) {
    case "collapsed":
      return viewportHeight.value - peekHeightPx.value
    case "half-open":
      return viewportHeight.value - halfOpenHeightPx.value
    case "expanded":
      return 0
  }
}

// 当前目标 translateY
const targetTranslateY = computed(() => {
  if (isDragging.value) {
    // dragOffset 正数=向下，sheet往下移
    return stateToTranslateY(sheetState.value) + dragOffset.value
  }
  return stateToTranslateY(sheetState.value)
})

// 背景遮罩透明度
const backdropOpacity = computed(() => {
  if (!isVisible.value) return 0
  if (isDragging.value) {
    const progress = Math.min(Math.abs(dragOffset.value) / 300, 1)
    return 0.3 + progress * 0.4
  }
  switch (sheetState.value) {
    case "collapsed": return 0.3
    case "half-open":  return 0.5
    case "expanded":   return 0.7
  }
})

// ─── 弹性效果（Rubber-band） ──────────────────────────────────────────────────
const getRubberBandedDelta = (delta: number, resistance = 0.45): number => {
  if (delta >= 0) return delta
  // 向上拽时加大阻力
  const stretched = Math.abs(delta)
  return -(stretched * (1 - Math.min(stretched / (stretched + 250), resistance)))
}

// ─── 状态切换逻辑 ─────────────────────────────────────────────────────────────
const setState = (state: SheetState) => {
  if (sheetState.value === state) return
  sheetState.value = state
  emit("state-change", state)
}

const closeSheet = () => {
  if (isAnimating.value) return
  isAnimating.value = true
  isVisible.value = false
  setTimeout(() => {
    emit("update:visible", false)
    emit("close")
    isAnimating.value = false
  }, 300)
}

const openSheet = (initialState: SheetState = props.initialState) => {
  setState(initialState)
  isVisible.value = true
  document.body.style.overflow = "hidden"
}

// ─── 手势处理 ─────────────────────────────────────────────────────────────────
useSwipeGesture(
  sheetRef,
  {
    horizontal: false,
    vertical: true,
    threshold: 10,
    maxDuration: 1500,
    preventScroll: false,
    hapticFeedback: false,
    onSwipeStart: () => {
      isDragging.value = true
    },
    onSwipeMove: (state) => {
      if (!isDragging.value) return
      // 正 distanceY = 向下拉
      if (state.distanceY > 0) {
        dragOffset.value = getRubberBandedDelta(state.distanceY, 0.5)
      } else {
        // 向上拽（只允许 expanded 状态下向上拽到 half-open）
        dragOffset.value = getRubberBandedDelta(state.distanceY, 0.6)
      }
    },
    onSwipeEnd: (state, direction) => {
      isDragging.value = false
      const velocityPxS = Math.abs(state.velocityY) * 1000
      const dist = state.distanceY
      const fastSwipe = velocityPxS > props.velocityThreshold

      if (sheetState.value === "collapsed") {
        // 从 collapsed 向上滑 → half-open 或 expanded
        if (fastSwipe && state.velocityY < 0) {
          setState("expanded")
        } else if (dist < -props.expandThreshold || fastSwipe) {
          setState(dist < -props.expandThreshold * 0.5 ? "expanded" : "half-open")
        } else {
          setState("collapsed")
        }
      } else if (sheetState.value === "half-open") {
        if (fastSwipe && state.velocityY < 0) {
          setState("expanded")
        } else if (fastSwipe && state.velocityY > 0) {
          setState("collapsed")
        } else if (dist > props.closeThreshold || (dist > props.expandThreshold * 0.5 && !direction.primary?.startsWith("up"))) {
          setState("collapsed")
        } else if (dist < -props.expandThreshold) {
          setState("expanded")
        } else {
          setState("half-open")
        }
      } else {
        // expanded 状态
        if (fastSwipe && state.velocityY > 0) {
          setState("collapsed")
        } else if (dist > props.closeThreshold || fastSwipe) {
          setState(dist > props.expandThreshold * 1.5 ? "collapsed" : "half-open")
        } else if (dist < -props.expandThreshold * 0.5) {
          setState("half-open")
        } else {
          setState("expanded")
        }
      }

      dragOffset.value = 0
    },
    onSwipeCancel: () => {
      isDragging.value = false
      dragOffset.value = 0
    },
  },
  {
    horizontal: false,
    vertical: true,
    threshold: 10,
  }
)

// ─── 鼠标拖拽支持（桌面端调试） ───────────────────────────────────────────────
let mouseDragging = false
let mouseStartY = 0
let mouseStartOffset = 0

const handleMouseDown = (e: MouseEvent) => {
  if (!props.swipeable) return
  mouseDragging = true
  mouseStartY = e.clientY
  mouseStartOffset = dragOffset.value
  document.addEventListener("mousemove", handleMouseMove)
  document.addEventListener("mouseup", handleMouseUp)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!mouseDragging) return
  const delta = e.clientY - mouseStartY
  if (delta > 0) {
    dragOffset.value = getRubberBandedDelta(delta, 0.5)
  } else {
    dragOffset.value = getRubberBandedDelta(delta, 0.6)
  }
}

const handleMouseUp = (e: MouseEvent) => {
  if (!mouseDragging) return
  mouseDragging = false
  const dist = e.clientY - mouseStartY
  const velocity = Math.abs(dist) / 300 // 粗略速度估算
  const fastSwipe = velocity > 0.8

  // 模拟手势结束逻辑
  const fakeState = { distanceY: dist, velocityY: velocity / 1000 }
  const fakeDir = { primary: dist < 0 ? "up" : "down" as const, isHorizontal: false, isVertical: true }

  // 复用上面的切换逻辑（简化版）
  if (sheetState.value === "collapsed") {
    if (fastSwipe && dist < 0) setState("expanded")
    else if (dist < -props.expandThreshold) setState(dist < -props.expandThreshold * 0.5 ? "expanded" : "half-open")
    else setState("collapsed")
  } else if (sheetState.value === "half-open") {
    if (fastSwipe && dist > 0) setState("collapsed")
    else if (dist > props.closeThreshold) setState("collapsed")
    else if (dist < -props.expandThreshold) setState("expanded")
    else setState("half-open")
  } else {
    if (fastSwipe && dist > 0) setState(dist > props.expandThreshold * 1.5 ? "collapsed" : "half-open")
    else if (dist > props.closeThreshold) setState(dist > props.expandThreshold * 1.5 ? "collapsed" : "half-open")
    else if (dist < -props.expandThreshold * 0.5) setState("half-open")
    else setState("expanded")
  }

  dragOffset.value = 0
  document.removeEventListener("mousemove", handleMouseMove)
  document.removeEventListener("mouseup", handleMouseUp)
}

// ─── 监听 visible prop 变化 ────────────────────────────────────────────────────
watch(() => props.visible, (visible) => {
  if (visible) {
    openSheet()
  } else {
    closeSheet()
  }
}, { immediate: true })

// ─── 防止内容区滚动穿透 ────────────────────────────────────────────────────────
const handleContentTouchMove = (e: TouchEvent) => {
  if (isDragging.value) {
    e.preventDefault()
  }
}

// ─── 键盘 ESC 关闭 ────────────────────────────────────────────────────────────
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.visible) {
    e.preventDefault()
    closeSheet()
  }
}

// ─── 点击遮罩关闭 ────────────────────────────────────────────────────────────
const handleBackdropClick = () => {
  closeSheet()
}

// ─── 公开方法（通过 defineExpose） ────────────────────────────────────────────
const expand  = () => setState("expanded")
const halfOpen = () => setState("half-open")
const collapse = () => setState("collapsed")
const close    = closeSheet

defineExpose({ expand, halfOpen, collapse, close, state: sheetState })

// ─── 生命周期 ─────────────────────────────────────────────────────────────────
onMounted(() => {
  viewportHeight.value = window.innerHeight
  window.addEventListener("resize", () => {
    viewportHeight.value = window.innerHeight
  })
  document.addEventListener("keydown", handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown)
  document.removeEventListener("mousemove", handleMouseMove)
  document.removeEventListener("mouseup", handleMouseUp)
  document.body.style.overflow = ""
})
</script>

<template>
  <Teleport to="body">
    <!-- 背景遮罩 -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      leave-active-class="transition-opacity duration-250 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-50"
        :style="{ backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` }"
        role="button"
        tabindex="-1"
        :aria-label="t('common.close')"
        @click="handleBackdropClick"
      />
    </Transition>

    <!-- Sheet 容器 -->
    <Transition
      enter-active-class="transition-all duration-350 ease-out"
      leave-active-class="transition-all duration-250 ease-in"
      enter-from-class="translate-y-full"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="isVisible"
        ref="sheetRef"
        class="fixed left-0 right-0 z-50 flex flex-col overflow-hidden rounded-t-3xl shadow-2xl"
        :class="[
          'bg-white dark:bg-stone-800',
          'transition-transform duration-300 ease-out',
          isDragging ? 'duration-0' : '',
        ]"
        :style="{
          top: 0,
          maxHeight: maxHeight,
          height: maxHeight,
          transform: `translateY(${targetTranslateY}px)`,
        }"
        role="dialog"
        aria-modal="true"
        :aria-label="title || undefined"
        @mousedown="handleMouseDown"
      >
        <!-- 拖动条 -->
        <div
          v-if="showHandle"
          class="flex justify-center py-3 shrink-0 select-none cursor-grab active:cursor-grabbing"
        >
          <div class="w-10 h-1 bg-gray-300 dark:bg-stone-600 rounded-full" />
        </div>

        <!-- 标题栏 -->
        <div
          v-if="title || $slots.header"
          class="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-stone-700 shrink-0"
        >
          <slot name="header">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white truncate">
              {{ title }}
            </h2>
          </slot>
          <button
            @click="closeSheet"
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors shrink-0 ml-2"
            :aria-label="t('common.close')"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 状态指示器（半开时显示） -->
        <div
          v-if="sheetState === 'half-open'"
          class="flex justify-center py-1 shrink-0"
        >
          <div class="w-8 h-1 bg-stone-300 dark:bg-stone-600 rounded-full" />
        </div>

        <!-- 内容区域 -->
        <div
          ref="contentRef"
          class="flex-1 overflow-y-auto overscroll-contain"
          @touchmove.passive="handleContentTouchMove"
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

        <!-- 状态切换辅助按钮（可自定义） -->
        <slot name="actions" :state="sheetState" :expand="expand" :halfOpen="halfOpen" :collapse="collapse" />
      </div>
    </Transition>
  </Teleport>
</template>
