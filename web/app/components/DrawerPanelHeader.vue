<script setup lang="ts">
/**
 * DrawerPanelHeader - 抽屉面板头部
 *
 * 包含 Logo 和关闭按钮
 * 特性：
 * - 入场动画
 * - 焦点管理
 */

interface Props {
  isContentVisible: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const lastFocusableRef = ref<HTMLElement | null>(null)

defineExpose({
  focusMenuButton: () => lastFocusableRef.value?.focus()
})
</script>

<template>
  <!-- 头部 - 入场动画 -->
  <div
    class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-stone-700 transform transition-all duration-400 ease-out"
    :class="isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'"
    :style="{ transitionTimingFunction: 'cubic-bezier(0.34, 1.2, 0.64, 1)' }"
  >
    <div class="flex items-center gap-2">
      <span class="text-2xl">🍳</span>
      <span class="font-bold text-orange-600 dark:text-orange-400">{{ t('app.title') }}</span>
    </div>
    <button
      ref="lastFocusableRef"
      @click="emit('close')"
      class="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-stone-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 touch-manipulation"
      :aria-label="t('common.close', '关闭')"
    >
      <svg class="w-6 h-6 text-gray-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>
