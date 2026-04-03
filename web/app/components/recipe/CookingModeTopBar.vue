<script setup lang="ts">
/**
 * CookingModeTopBar - 烹饪模式顶部栏组件
 *
 * 功能：
 * - 关闭按钮
 * - 步骤计数显示
 * - 屏幕常亮指示器
 */
const { t } = useI18n()

defineProps<{
  currentStep: number
  totalSteps: number
  wakeLockSupported: boolean
  wakeLock: WakeLockSentinel | null
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="flex items-center justify-between px-4 py-3 bg-stone-800 border-b border-stone-700 flex-shrink-0">
    <div class="flex items-center gap-3">
      <button
        @click="emit('close')"
        class="flex items-center gap-1.5 text-stone-400 hover:text-white transition-colors text-sm font-medium min-w-[44px] min-h-[44px] justify-center rounded-lg hover:bg-stone-700"
        :aria-label="t('cookingMode.exit')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span class="hidden sm:inline">{{ t('cookingMode.exit') }}</span>
      </button>

      <div class="h-6 w-px bg-stone-700 hidden sm:block"></div>

      <div class="hidden sm:flex items-center gap-2 text-stone-400 text-sm">
        <span>{{ t('cookingMode.stepOf', { current: currentStep + 1, total: totalSteps }) }}</span>
      </div>
    </div>

    <!-- Wake lock indicator -->
    <div v-if="wakeLockSupported && wakeLock" class="flex items-center gap-1.5 text-green-400 text-xs">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
      </svg>
      <span class="hidden sm:inline">{{ t('cookingMode.screenOn') }}</span>
    </div>
  </div>
</template>
