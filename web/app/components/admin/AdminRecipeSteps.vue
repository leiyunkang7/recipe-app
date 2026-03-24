<script setup lang="ts">
import type { Locale, StepTranslation } from '~/types'
import { generateTempId, getTranslation, setTranslation } from '~/utils/form'

interface StepWithTempId {
  _tempId?: string
  stepNumber: number
  instruction: string
  durationMinutes?: number
  translations: StepTranslation[]
}

const props = defineProps<{
  steps: StepWithTempId[]
  activeLocale: Locale
}>()

const emit = defineEmits<{
  'update:steps': [value: StepWithTempId[]]
}>()

const { t } = useI18n()

const getStepInstruction = (index: number) => {
  const step = props.steps[index]
  return getTranslation(step?.translations, props.activeLocale, 'instruction') || step?.instruction || ''
}

const setStepInstruction = (index: number, value: string) => {
  const newSteps = [...props.steps]
  const step = newSteps[index]
  if (!step) return

  step.translations = setTranslation(step.translations, props.activeLocale, 'instruction', value)
  if (props.activeLocale === 'en') {
    step.instruction = value
  }

  emit('update:steps', newSteps)
}

const addStep = () => {
  const newSteps = [...props.steps, {
    _tempId: generateTempId('step'),
    stepNumber: props.steps.length + 1,
    instruction: '',
    durationMinutes: undefined,
    translations: [
      { locale: 'en' as Locale, instruction: '' },
      { locale: 'zh-CN' as Locale, instruction: '' },
    ],
  }]
  emit('update:steps', newSteps)
}

const removeStep = (index: number) => {
  // Use filter for immutability, then renumber
  const newSteps = props.steps
    .filter((_, i) => i !== index)
    .map((step, i) => ({ ...step, stepNumber: i + 1 }))
  emit('update:steps', newSteps)
}

const updateDuration = (index: number, value: number | undefined) => {
  const newSteps = [...props.steps]
  newSteps[index].durationMinutes = value
  emit('update:steps', newSteps)
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-4 sm:p-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <h2 class="text-lg sm:text-xl font-bold text-gray-900">{{ t('form.steps') }}</h2>
      <button
        type="button"
        @click="addStep"
        class="px-4 py-2 min-h-[44px] bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
      >
        + {{ t('form.addStep') }}
      </button>
    </div>

    <div class="space-y-4">
      <div
        v-for="(step, index) in steps"
        :key="step._tempId || index"
        class="flex gap-2 sm:gap-3 items-start"
      >
        <span class="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm mt-2">
          {{ step.stepNumber }}
        </span>
        <div class="flex-1 space-y-2 min-w-0">
          <textarea
            :value="getStepInstruction(index)"
            @input="setStepInstruction(index, ($event.target as HTMLTextAreaElement).value)"
            rows="2"
            :placeholder="t('form.instruction')"
            class="w-full px-3 py-2 min-h-[44px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm sm:text-base"
          />
          <input
            :value="step.durationMinutes"
            @input="updateDuration(index, ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
            type="number"
            min="0"
            :placeholder="t('form.duration')"
            class="w-full px-3 py-2 min-h-[44px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm sm:text-base"
          />
        </div>
        <button
          type="button"
          @click="removeStep(index)"
          class="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1 shrink-0"
          :aria-label="t('common.delete')"
        >
          🗑️
        </button>
      </div>
    </div>
  </div>
</template>
