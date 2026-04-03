<script setup lang="ts">
/**
 * CookingModeBottomNav - 烹饪模式底部导航组件
 *
 * 功能：
 * - 上一步/下一步按钮
 * - 步骤进度点
 * - 键盘导航支持
 */
import type { Recipe } from '~/types'

const { t } = useI18n()

const props = defineProps<{
  recipe: Recipe
  currentStep: number
  totalSteps: number
  canGoPrev: boolean
  canGoNext: boolean
}>()

const emit = defineEmits<{
  prev: []
  next: []
  close: []
  goToStep: [index: number]
}>()
</script>

<template>
  <div class="flex items-center justify-between px-4 py-4 bg-stone-800 border-t border-stone-700 flex-shrink-0">
    <!-- Prev button -->
    <button
      @click="emit('prev')"
      :disabled="!canGoPrev"
      class="flex items-center gap-2 min-h-[52px] px-5 rounded-xl font-semibold text-base transition-colors"
      :class="canGoPrev
        ? 'bg-stone-700 hover:bg-stone-600 text-white'
        : 'bg-stone-800 text-stone-600 cursor-not-allowed'"
      :aria-label="t('cookingMode.prevStep')"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      <span>{{ t('cookingMode.prev') }}</span>
    </button>

    <!-- Step dots -->
    <div class="flex items-center gap-1.5 overflow-x-auto max-w-[40vw]">
      <button
        v-for="(_, i) in recipe.steps"
        :key="i"
        @click="emit('goToStep', i)"
        class="w-2.5 h-2.5 rounded-full transition-all flex-shrink-0 min-w-[10px]"
        :class="i === currentStep
          ? 'bg-orange-500 w-6'
          : i < currentStep
            ? 'bg-orange-500/50 hover:bg-orange-500/70'
            : 'bg-stone-600 hover:bg-stone-500'"
        :aria-label="`${t('cookingMode.goToStep')} ${i + 1}`"
        :aria-current="i === currentStep ? 'step' : undefined"
      ></button>
    </div>

    <!-- Next / Finish button -->
    <button
      @click="canGoNext ? emit('next') : emit('close')"
      class="flex items-center gap-2 min-h-[52px] px-5 rounded-xl font-semibold text-base transition-colors"
      :class="canGoNext
        ? 'bg-orange-500 hover:bg-orange-400 text-white'
        : 'bg-green-600 hover:bg-green-500 text-white'"
      :aria-label="canGoNext ? t('cookingMode.nextStep') : t('cookingMode.finish')"
    >
      <span>{{ canGoNext ? t('cookingMode.next') : t('cookingMode.finish') }}</span>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path v-if="canGoNext" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </button>
  </div>
</template>
