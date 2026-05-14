<script setup lang="ts">
/**
 * DrawerPanelFooter - 抽屉面板底部信息
 *
 * 特性：
 * - 入场动画
 */

interface Props {
  isContentVisible: boolean
}

defineProps<Props>()
</script>

<template>
  <!-- 底部信息 - 入场动画 -->
  <div
    class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-stone-700 transform transition-all duration-400 ease-out"
    :class="isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'"
    :style="{ transitionTimingFunction: 'cubic-bezier(0.34, 1.2, 0.64, 1)' }"
  >
    <p class="text-xs text-gray-400 dark:text-stone-500 text-center">
      {{ $t('app.subtitle') }}
    </p>
  </div>
</template>
