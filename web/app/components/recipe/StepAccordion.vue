<script setup lang="ts">
/**
 * StepAccordion - 食谱步骤手风琴组件
 *
 * 功能：
 * - 手风琴展开/折叠动画
 * - 步骤插图 + 进度指示
 * - 当前步骤高亮
 * - 步骤时长 + 温度显示
 * - 移动端/桌面端自适应
 * - 阅读模式支持
 *
 * 使用方式：
 * <StepAccordion
 *   :recipe="recipe"
 *   :current-step="currentStep"
 *   :is-mobile="isMobile"
 *   @update:currentStep="setStep"
 * />
 */
import type { Recipe } from '~/types'
import { useTemperatureUnit } from '~/composables/useTemperatureUnit'

interface Props {
  recipe: Recipe
  currentStep: number
  isMobile?: boolean
  readingModeClasses?: string
}

const props = withDefaults(defineProps<Props>(), {
  isMobile: false,
  readingModeClasses: '',
})

const emit = defineEmits<{
  'update:currentStep': [index: number]
}>()

const { t } = useI18n()
const { formatTemp } = useTemperatureUnit()

const totalSteps = computed(() => props.recipe.steps?.length || 0)

const formatDuration = (minutes?: number) => {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} ${t('recipe.min')}`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}${t('recipe.min')}` : `${h}h`
}

// Which step is expanded - if none explicitly expanded, show currentStep
const expandedStep = ref<number | null>(null)

const isExpanded = (index: number) =>
  expandedStep.value === index || (expandedStep.value === null && props.currentStep === index)

const toggleStep = (index: number) => {
  if (expandedStep.value === index) {
    expandedStep.value = null
  } else {
    expandedStep.value = index
    emit('update:currentStep', index)
  }
}

// Step illustration phase labels
const stepPhaseLabels = [
  'preparing',  // Step 1
  'cooking',    // Step 2
  'checking',   // Step 3
  'plating',    // Step 4
  'finishing',  // Step 5+
]

const getPhaseLabel = (index: number) => {
  const key = stepPhaseLabels[Math.min(index, stepPhaseLabels.length - 1)]
  return t(`recipe.stepPhase.${key}`)
}

// Progress indicator: completed / total
const completedSteps = computed(() => props.currentStep)

// Animation: smooth height transition is handled via CSS max-height + transition
</script>

<template>
  <div
    class="step-accordion bg-white dark:bg-stone-800 rounded-2xl shadow-sm overflow-hidden"
    :class="readingModeClasses"
  >
    <!-- Header -->
    <div class="px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-lg font-bold flex items-center gap-2">
          <span class="text-2xl" aria-hidden="true">📝</span>
          {{ t('recipe.instructions') }}
        </h2>
        <span class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
          {{ completedSteps + 1 }} / {{ totalSteps }}
        </span>
      </div>
      <!-- Progress bar -->
      <div class="h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          class="h-full bg-white rounded-full transition-all duration-400 ease-out"
          :style="{ width: `${Math.round(((completedSteps) / Math.max(totalSteps, 1)) * 100)}%` }"
        />
      </div>
    </div>

    <!-- Step list -->
    <div class="divide-y divide-stone-100 dark:divide-stone-700">
      <div
        v-for="(step, index) in recipe.steps"
        :key="index"
        class="step-item"
      >
        <!-- Step header (always visible) -->
        <button
          class="w-full flex items-center gap-3 p-4 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-inset"
          :class="[
            isExpanded(index)
              ? 'bg-orange-50 dark:bg-orange-900/20'
              : 'hover:bg-stone-50 dark:hover:bg-stone-700/50',
            readingModeClasses,
          ]"
          :aria-expanded="isExpanded(index)"
          :aria-controls="`step-content-${index}`"
          @click="toggleStep(index)"
        >
          <!-- Step number circle -->
          <div
            class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-200"
            :class="[
              index < currentStep
                ? 'bg-green-500 text-white'
                : index === currentStep
                  ? 'bg-orange-500 text-white'
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400',
            ]"
          >
            <!-- Completed checkmark -->
            <svg v-if="index < currentStep" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!-- Step preview -->
          <div class="flex-1 min-w-0">
            <!-- Phase label (small, shown for expanded step) -->
            <div v-if="isExpanded(index)" class="mb-1">
              <span class="text-xs font-medium text-orange-500 dark:text-orange-400 uppercase tracking-wide">
                {{ getPhaseLabel(index) }}
              </span>
            </div>
            <!-- Instruction preview -->
            <p
              class="text-sm font-medium leading-snug transition-colors"
              :class="[
                isExpanded(index)
                  ? 'text-orange-700 dark:text-orange-300'
                  : 'text-gray-700 dark:text-stone-300',
                isExpanded(index) ? '' : 'line-clamp-2',
              ]"
            >
              {{ step.instruction }}
            </p>
            <!-- Step meta (compact, always visible) -->
            <div class="mt-1 flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
              <span v-if="step.durationMinutes" class="flex items-center gap-0.5">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ formatDuration(step.durationMinutes) }}
              </span>
              <span v-if="step.temperature" class="flex items-center gap-0.5 text-orange-400">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {{ formatTemp(step.temperature) }}
              </span>
              <span v-if="step.imageUrl" class="flex items-center gap-0.5">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ t('recipe.stepImage', { step: index + 1 }) }}
              </span>
            </div>
          </div>

          <!-- Expand/collapse chevron -->
          <svg
            class="flex-shrink-0 w-5 h-5 text-stone-400 transition-transform duration-300"
            :class="isExpanded(index) ? 'rotate-180' : 'rotate-0'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Expandable content -->
        <div
          :id="`step-content-${index}`"
          class="overflow-hidden transition-all duration-300 ease-in-out"
          :class="isExpanded(index) ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'"
        >
          <div class="px-4 pb-4 pl-[calc(1rem+40px)]">
            <!-- Step illustration (when no image) -->
            <div v-if="!step.imageUrl" class="mb-4 flex justify-start">
              <StepIllustration
                :step-number="index + 1"
                :total-steps="totalSteps"
                :has-image="false"
                size="lg"
              />
            </div>

            <!-- Step image -->
            <div v-if="step.imageUrl" class="mb-4">
              <AppImage
                :src="step.imageUrl"
                :alt="t('recipe.stepImage', { step: index + 1 })"
                class="w-full rounded-xl max-h-64 object-cover"
                sizes="sm:100vw md:50vw"
                object-fit="cover"
              />
            </div>

            <!-- Full instruction text -->
            <p class="text-gray-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
              {{ step.instruction }}
            </p>

            <!-- Step actions -->
            <div class="mt-4 flex items-center gap-3 flex-wrap">
              <!-- Duration chip -->
              <div
                v-if="step.durationMinutes"
                class="flex items-center gap-1.5 text-sm bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-3 py-1.5 rounded-full"
              >
                <svg class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ formatDuration(step.durationMinutes) }}
              </div>

              <!-- Temperature chip -->
              <div
                v-if="step.temperature"
                class="flex items-center gap-1.5 text-sm bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {{ formatTemp(step.temperature) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-accordion {
  contain: layout style;
}

/* Smooth height transition handled via max-height technique */
.step-item {
  contain: layout style;
}

/* Accordion expand/collapse animation */
.step-item > div:last-child {
  transition: max-height 0.3s ease-in-out, opacity 0.25s ease-in-out;
}

/* Phase label entrance animation */
.step-item button > div > span {
  animation: fadeSlideIn 0.2s ease-out;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .step-accordion,
  .step-accordion *,
  .step-item,
  .step-item * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
