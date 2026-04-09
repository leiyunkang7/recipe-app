<script setup lang="ts">
/**
 * RecipeDetailSteps - 食谱详情页步骤列表组件
 *
 * 功能：
 * - 响应式布局 (移动端/桌面端)
 * - 当前步骤高亮
 * - 步骤时长显示
 * - 点击选择步骤
 * - 预计算样式优化
 * - 阅读模式支持
 *
 * 使用方式：
 * <RecipeDetailSteps
 *   :recipe="recipe"
 *   :current-step="0"
 *   :expanded-steps="expanded"
 *   :reading-mode-classes="classes"
 *   @update:current-step="setStep"
 * />
 */
import type { Recipe } from '~/types'
import StepIllustration from '~/components/recipe/StepIllustration.vue'
import { useTemperatureUnit } from '~/composables/useTemperatureUnit'

const props = withDefaults(defineProps<{
  recipe: Recipe
  currentStep: number
  isMobile?: boolean
  expandedSteps: Set<number>
  readingModeClasses?: string
}>(), {
  isMobile: false,
  readingModeClasses: '',
})

const emit = defineEmits<{
  'update:currentStep': [index: number]
  toggleExpand: [index: number]
}>()

const { t } = useI18n()
const { formatTemp } = useTemperatureUnit()

// Pre-compute step states to avoid repeated Map.get() calls in template
// Memoize by currentStep and expandedSteps.size since expandedSteps Set reference changes on every toggle
const stepsWithStates = computed(() => {
  const current = props.currentStep
  const expanded = props.expandedSteps
  return props.recipe.steps.map((step, i) => {
    const isCurrent = current === i
    const isExpanded = expanded.has(i)
    return {
      step,
      index: i,
      isCurrent,
      isExpanded,
      containerClass: isCurrent
        ? 'bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-500 dark:border-orange-600 shadow-md'
        : 'hover:bg-stone-50 dark:hover:bg-stone-700 border-2 border-transparent',
      spanClass: isCurrent
        ? 'bg-orange-500 text-white'
        : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
      lineClamp: !isExpanded && !isCurrent,
    }
  })
})
</script>

<template>
  <!-- Mobile Steps -->
  <div v-if="isMobile" class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm p-4">
    <h2 class="text-lg font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
      📝 {{ t('recipe.instructions') }}
    </h2>
    <ol class="space-y-3">
      <li
        v-for="{ step, index, isCurrent, isExpanded, containerClass, spanClass, lineClamp } in stepsWithStates"
        :key="index"
        v-memo="[isCurrent, isExpanded]"
        role="button"
        tabindex="0"
        class="flex gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer"
        :class="[containerClass, readingModeClasses]"
        @click="emit('update:currentStep', index)"
        @keydown.enter="emit('update:currentStep', index)"
      >
        <span
          class="flex-shrink-0 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center font-bold text-sm"
          :class="spanClass"
        >
          {{ index + 1 }}
        </span>
        <div class="flex-1 min-w-0">
          <AppImage
            v-if="step.imageUrl"
            :src="step.imageUrl"
            :alt="t('recipe.stepImage', { step: index + 1 })"
            class="w-full h-40 rounded-lg mb-2"
            sizes="sm:100vw md:400px"
            object-fit="cover"
          />
          <div v-else class="mb-2">
            <StepIllustration :step-number="index + 1" :total-steps="recipe.steps?.length || 0" size="md" />
          </div>
          <p class="text-gray-900 dark:text-stone-100 text-sm leading-relaxed" :class="{ 'line-clamp-3': lineClamp }">
            {{ step.instruction }}
          </p>
          <p v-if="step.durationMinutes" class="text-sm text-gray-500 dark:text-stone-400 mt-1.5 flex items-center gap-1">
            <ClockIcon />
            {{ t('recipe.duration') }}: {{ step.durationMinutes }} {{ t('recipe.min') }}
          </p>
          <p v-if="step.temperature" class="text-sm text-orange-500 dark:text-orange-400 mt-1 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {{ formatTemp(step.temperature) }}
          </p>
        </div>
      </li>
    </ol>
  </div>

  <!-- Desktop Steps -->
  <div v-else class="bg-white dark:bg-stone-800 rounded-xl shadow-md dark:shadow-stone-900/30 p-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
      📝 {{ t('recipe.instructions') }}
    </h2>
    <ol class="space-y-4">
      <li
        v-for="{ step, index, isCurrent, isExpanded, containerClass, spanClass } in stepsWithStates"
        :key="index"
        v-memo="[isCurrent, isExpanded]"
        role="button"
        tabindex="0"
        class="flex gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200"
        :class="[containerClass, readingModeClasses]"
        @click="emit('update:currentStep', index)"
        @keydown.enter="emit('update:currentStep', index)"
      >
        <span
          class="flex-shrink-0 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center font-bold text-sm"
          :class="spanClass"
        >
          {{ index + 1 }}
        </span>
        <div class="flex-1">
          <AppImage
            v-if="step.imageUrl"
            :src="step.imageUrl"
            :alt="t('recipe.stepImage', { step: index + 1 })"
            class="w-full max-w-md h-48 rounded-lg mb-3"
            sizes="md:400px"
            object-fit="cover"
          />
          <div v-else class="mb-3">
            <StepIllustration :step-number="index + 1" :total-steps="recipe.steps?.length || 0" size="md" />
          </div>
          <p class="text-gray-900 dark:text-stone-100 leading-relaxed">{{ step.instruction }}</p>
          <p v-if="step.durationMinutes" class="text-sm text-gray-500 dark:text-stone-400 mt-2">
            <ClockIcon class="inline-block" /> {{ t('recipe.duration') }}: {{ step.durationMinutes }} {{ t('recipe.min') }}
          </p>
          <p v-if="step.temperature" class="text-sm text-orange-500 dark:text-orange-400 mt-2 flex items-center gap-1">
            <svg class="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {{ formatTemp(step.temperature) }}
          </p>
        </div>
      </li>
    </ol>
  </div>
</template>
