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
import CheckCircleIcon from '~/components/icons/CheckCircleIcon.vue'
import ChevronDownIcon from '~/components/icons/ChevronDownIcon.vue'
import BarChartIcon from '~/components/icons/BarChartIcon.vue'
import ImageIcon from '~/components/icons/ImageIcon.vue'

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

const progressPercent = computed(() =>
  Math.round((completedSteps.value / Math.max(totalSteps.value, 1)) * 100)
)

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
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <!-- Step list -->
    <div class="divide-y divide-stone-100 dark:divide-stone-700">
      <div
        v-for="(step, index) in recipe.steps"
        :key="index"
        v-memo="[step.instruction, step.durationMinutes, step.temperature, step.imageUrl, currentStep, expandedStep.value]"
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
            <CheckCircleIcon v-if="index < currentStep" class="w-5 h-5" />
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
                <TimerIcon class="w-3 h-3" />
                {{ formatDuration(step.durationMinutes) }}
              </span>
              <span v-if="step.temperature" class="flex items-center gap-0.5 text-orange-400">
                <BarChartIcon class="w-3 h-3" />
                {{ formatTemp(step.temperature) }}
              </span>
              <span v-if="step.imageUrl" class="flex items-center gap-0.5">
                <ImageIcon class="w-3 h-3" />
                {{ t('recipe.stepImage', { step: index + 1 }) }}
              </span>
            </div>
          </div>

          <!-- Expand/collapse chevron -->
          <ChevronDownIcon
            class="flex-shrink-0 w-5 h-5 text-stone-400 transition-transform duration-300"
            :class="isExpanded(index) ? 'rotate-180' : ''"
          />
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
                <TimerIcon class="w-4 h-4 text-stone-400" />
                {{ formatDuration(step.durationMinutes) }}
              </div>

              <!-- Temperature chip -->
              <div
                v-if="step.temperature"
                class="flex items-center gap-1.5 text-sm bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full"
              >
                <BarChartIcon class="w-4 h-4" />
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
