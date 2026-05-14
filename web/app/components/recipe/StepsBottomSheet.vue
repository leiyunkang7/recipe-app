<script setup lang="ts">
/**
 * StepsBottomSheet - 移动端步骤 Bottom Sheet
 *
 * 特性：
 * - 移动端从底部滑出的步骤列表
 * - 当前步骤高亮
 * - 步骤展开/折叠（点击切换）
 * - 步骤进度指示
 * - 步骤时长 + 温度显示
 * - 弹性拖拽 + snap points
 * - 暗色模式支持
 *
 * 使用方式：
 * <StepsBottomSheet
 *   :visible="showSteps"
 *   :recipe="recipe"
 *   :current-step="currentStep"
 *   @close="showSteps = false"
 *   @update:current-step="(i) => currentStep = i"
 * />
 */
import type { Recipe } from '~/types'
import BottomSheet from '~/components/BottomSheet.vue'
import { useTemperatureUnit } from '~/composables/useTemperatureUnit'
import StepIllustration from '~/components/recipe/StepIllustration.vue'

interface Props {
  visible: boolean
  recipe: Recipe | null
  currentStep: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'update:currentStep': [index: number]
}>()

const { t } = useI18n()
const { formatTemp } = useTemperatureUnit()

const totalSteps = computed(() => props.recipe?.steps?.length ?? 0)

// Which step is explicitly expanded
const expandedStep = ref<number | null>(null)

// A step is "active" if it's the current step OR explicitly expanded
const isActive = (index: number) =>
  expandedStep.value === index || (expandedStep.value === null && props.currentStep === index)

const toggleStep = (index: number) => {
  if (expandedStep.value === index) {
    expandedStep.value = null
  } else {
    expandedStep.value = index
    emit('update:currentStep', index)
  }
}

const formatDuration = (minutes?: number) => {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} ${t('recipe.min')}`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}${t('recipe.min')}` : `${h}h`
}

// Progress
const progressPercent = computed(() => {
  if (totalSteps.value === 0) return 0
  return Math.round(((props.currentStep + 1) / totalSteps.value) * 100)
})
</script>

<template>
  <BottomSheet
    :visible="visible"
    :title="t('recipe.instructions')"
    :snap-points="[50, 80, 95]"
    :default-snap-index="1"
    swipeable
    @close="emit('close')"
  >
    <div class="space-y-3 pb-2">

      <!-- ── Progress header ─────────────────────────────────────── -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {{ props.currentStep + 1 }} / {{ totalSteps }}
          </span>
          <span class="text-xs text-gray-400 dark:text-gray-500">
            {{ progressPercent }}% {{ t('recipe.completed') || '完成' }}
          </span>
        </div>
        <!-- Progress bar -->
        <div class="h-1.5 bg-gray-100 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-500 ease-out"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </div>

      <!-- ── Divider ─────────────────────────────────────────────── -->
      <div class="border-t border-gray-100 dark:border-stone-700" />

      <!-- ── Steps list ───────────────────────────────────────────── -->
      <ol class="space-y-3 max-h-[60vh] overflow-y-auto pb-4">
        <li
          v-for="(step, index) in recipe?.steps"
          :key="index"
          class="flex gap-3 cursor-pointer transition-all duration-200 active:scale-[0.98]"
          :class="[
            isActive(index)
              ? 'p-3 rounded-xl border-2 border-orange-500 dark:border-orange-600 bg-orange-50/60 dark:bg-orange-900/20'
              : 'p-3 rounded-xl border-2 border-transparent hover:bg-stone-50 dark:hover:bg-stone-700/50'
          ]"
          @click="toggleStep(index)"
        >
          <!-- Step number circle -->
          <div
            class="flex-shrink-0 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center font-bold text-sm transition-colors"
            :class="[
              index < props.currentStep
                ? 'bg-green-500 text-white'
                : index === props.currentStep
                  ? 'bg-orange-500 text-white'
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
            ]"
          >
            <svg v-if="index < props.currentStep" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <!-- Step image -->
            <div v-if="step.imageUrl" class="mb-2 rounded-lg overflow-hidden">
              <AppImage
                :src="step.imageUrl"
                :alt="t('recipe.stepImage', { step: index + 1 })"
                class="w-full h-36 object-cover"
                sizes="sm:100vw"
              />
            </div>
            <!-- Step illustration (when no image) -->
            <div v-else-if="isActive(index)" class="mb-2 flex justify-start">
              <StepIllustration
                :step-number="index + 1"
                :total-steps="totalSteps"
                size="md"
              />
            </div>

            <!-- Instruction text -->
            <p
              class="text-sm leading-relaxed transition-colors"
              :class="[
                isActive(index)
                  ? 'text-gray-900 dark:text-stone-100'
                  : 'text-gray-600 dark:text-stone-400',
                !isActive(index) ? 'line-clamp-2' : ''
              ]"
            >
              {{ step.instruction }}
            </p>

            <!-- Expanded meta info -->
            <div v-if="isActive(index)" class="mt-2 flex flex-wrap items-center gap-2">
              <span
                v-if="step.durationMinutes"
                class="inline-flex items-center gap-1 text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-2.5 py-1 rounded-full"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ formatDuration(step.durationMinutes) }}
              </span>
              <span
                v-if="step.temperature"
                class="inline-flex items-center gap-1 text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {{ formatTemp(step.temperature) }}
              </span>
            </div>
          </div>
        </li>
      </ol>
    </div>
  </BottomSheet>
</template>
