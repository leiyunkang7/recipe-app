<script setup lang="ts">
/**
 * StepGuide - Enhanced step-by-step recipe guide with illustrations
 */
import type { Recipe } from '~/types'
import StepIllustration from '~/components/recipe/StepIllustration.vue'

interface Props {
  recipe: Recipe
  initialStep?: number
  isMobile?: boolean
  readingModeClasses?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialStep: 0,
  isMobile: false,
  readingModeClasses: '',
})

const emit = defineEmits<{
  stepChange: [index: number]
}>()

const { t } = useI18n()

const currentStep = ref(props.initialStep)
const totalSteps = computed(() => props.recipe.steps?.length || 0)
const showImageModal = ref(false)

const currentStepData = computed(() => {
  if (!props.recipe.steps?.length) return null
  return props.recipe.steps[currentStep.value]
})

const progressPercent = computed(() => {
  if (totalSteps.value === 0) return 0
  return Math.round(((currentStep.value + 1) / totalSteps.value) * 100)
})

const goToStep = (index: number) => {
  if (index >= 0 && index < totalSteps.value) {
    currentStep.value = index
    emit("stepChange", index)
  }
}

const goNext = () => goToStep(currentStep.value + 1)
const goPrev = () => goToStep(currentStep.value - 1)

const canGoNext = computed(() => currentStep.value < totalSteps.value - 1)
const canGoPrev = computed(() => currentStep.value > 0)

const formatDuration = (minutes?: number) => {
  if (!minutes) return ""
  if (minutes < 60) return minutes + " " + t("recipe.min")
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}${t("recipe.min")}` : `${hours}h`
}

const visibleThumbnails = computed(() => {
  const thumbnails = []
  const total = totalSteps.value
  const current = currentStep.value
  for (let i = 0; i < total; i++) {
    const step = props.recipe.steps[i]
    const isVisible = i === 0 || i === total - 1 || Math.abs(i - current) <= 2
    thumbnails.push({
      index: i,
      step,
      isCurrent: i === current,
      isCompleted: i < current,
      isVisible,
    })
  }
  return thumbnails
})

watch(() => props.initialStep, (newStep) => {
  if (newStep >= 0 && newStep < totalSteps.value) {
    currentStep.value = newStep
  }
})
</script>

<template>
  <div
    class="step-guide bg-white dark:bg-stone-800 rounded-2xl shadow-sm overflow-hidden"
    :class="[readingModeClasses]"
  >
    <!-- Header with progress -->
    <div class="px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-bold flex items-center gap-2">
          <span class="text-2xl">📖</span>
          {{ t("recipe.steps") }}
        </h3>
        <span class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
          {{ currentStep + 1 }} / {{ totalSteps }}
        </span>
      </div>
      <div class="h-2 bg-white/20 rounded-full overflow-hidden">
        <div
          class="h-full bg-white rounded-full transition-all duration-300"
          :style="{ width: progressPercent + '%' }"
        />
      </div>
    </div>

    <!-- Thumbnail strip -->
    <div class="px-4 py-3 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-700">
      <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          v-for="thumb in visibleThumbnails"
          v-show="thumb.isVisible"
          :key="thumb.index"
          @click="goToStep(thumb.index)"
          class="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          :class="thumb.isCurrent ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-700' : thumb.isCompleted ? 'border-green-500 opacity-80 hover:opacity-100' : 'border-stone-300 dark:border-stone-600 hover:border-stone-400 dark:hover:border-stone-500'"
          :aria-label="t('recipe.stepNumber') + ' ' + (thumb.index + 1)"
          :aria-current="thumb.isCurrent ? 'step' : undefined"
        >
          <div class="w-full h-full relative">
            <img v-if="thumb.step.imageUrl" :src="thumb.step.imageUrl" :alt="'Step ' + (thumb.index + 1)" class="w-full h-full object-cover" loading="lazy" />
            <StepIllustration v-else :step-number="thumb.index + 1" :total-steps="totalSteps" :has-image="false" size="sm" />
            <div v-if="thumb.isCompleted" class="absolute top-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Main step content -->
    <div class="p-4">
      <!-- Step illustration placeholder when no image -->
      <div v-if="!currentStepData?.imageUrl" class="mb-4 flex justify-center">
        <StepIllustration :step-number="currentStep + 1" :total-steps="totalSteps" :has-image="false" size="lg" />
      </div>

      <!-- Step image -->
      <div v-if="currentStepData?.imageUrl" class="mb-4 relative group">
        <img :src="currentStepData.imageUrl" :alt="t('recipe.stepImage', { step: currentStep + 1 })" class="w-full h-48 sm:h-64 object-cover rounded-xl cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]" loading="lazy" @click="showImageModal = true" />
        <div class="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{{ t("recipe.stepImageExpand") }}</div>
      </div>

      <!-- Step number and duration -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-lg">{{ currentStep + 1 }}</span>
          <span class="text-sm text-stone-500 dark:text-stone-400 font-medium">{{ t("recipe.stepNumber") }}</span>
        </div>
        <div v-if="currentStepData?.durationMinutes" class="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-700 px-3 py-1.5 rounded-full">
          <ClockIcon class="w-4 h-4" />
          <span>{{ formatDuration(currentStepData.durationMinutes) }}</span>
        </div>
      </div>

      <!-- Instruction text -->
      <p class="text-lg text-gray-900 dark:text-stone-100 leading-relaxed whitespace-pre-wrap mb-6">{{ currentStepData?.instruction }}</p>

      <!-- Navigation buttons -->
      <div class="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-700">
        <button @click="goPrev" :disabled="!canGoPrev" class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed" :class="canGoPrev ? 'bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-gray-700 dark:text-stone-200' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 dark:text-stone-600'" :aria-label="t('cookingMode.prev')">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          <span class="hidden sm:inline">{{ t("cookingMode.prev") }}</span>
        </button>

        <div class="flex items-center gap-1.5">
          <button v-for="(_, i) in recipe.steps" :key="i" @click="goToStep(i)" class="w-2.5 h-2.5 rounded-full transition-all duration-200" :class="i === currentStep ? 'bg-orange-500 w-5' : i < currentStep ? 'bg-orange-300 dark:bg-orange-700 hover:bg-orange-400 dark:hover:bg-orange-600' : 'bg-stone-300 dark:bg-stone-600 hover:bg-stone-400 dark:hover:bg-stone-500'" :aria-label="'Go to step ' + (i + 1)" />
        </div>

        <button @click="goNext" :disabled="!canGoNext" class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed" :class="canGoNext ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-600'" :aria-label="canGoNext ? t('cookingMode.next') : t('cookingMode.finish')">
          <span class="hidden sm:inline">{{ canGoNext ? t("cookingMode.next") : t("cookingMode.finish") }}</span>
          <svg v-if="canGoNext" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        </button>
      </div>
    </div>

    <!-- Image modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showImageModal && currentStepData?.imageUrl" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" @click.self="showImageModal = false" @keydown.esc="showImageModal = false">
          <button @click="showImageModal = false" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" aria-label="Close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img :src="currentStepData.imageUrl" :alt="t('recipe.stepImage', { step: currentStep + 1 })" class="max-w-full max-h-[90vh] object-contain rounded-lg" @click="showImageModal = false" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.step-guide {
  contain: layout style;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .step-guide,
  .step-guide *,
  .modal-enter-active,
  .modal-leave-active {
    transition: none !important;
    animation: none !important;
  }
}
</style>
