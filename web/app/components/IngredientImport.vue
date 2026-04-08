<script setup lang="ts">
import type { Locale, IngredientTranslation } from '~/types'
import { generateTempId } from '~/utils/form'

interface ExtractedIngredient {
  name: string
  amount: number | string
  unit: string
}

const props = defineProps<{
  activeLocale: Locale
}>()

const emit = defineEmits<{
  'import': [ingredients: Array<{
    _tempId?: string
    name: string
    amount: number
    unit: string
    translations: IngredientTranslation[]
  }>]
  'cancel': []
}>()

const { t } = useI18n()
const { extracting, error, extractedIngredients, previewImage, extractFromFile, clearExtraction, clearError } = useOcrImport()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const showConfirmModal = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  await processFile(file)
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]

  if (!file) return
  if (!file.type.startsWith('image/')) {
    error.value = t('ocr.imageOnly')
    return
  }

  await processFile(file)
}

const processFile = async (file: File) => {
  const ingredients = await extractFromFile(file)
  if (ingredients.length > 0) {
    showConfirmModal.value = true
  }
}

const handleImport = () => {
  const importedIngredients = extractedIngredients.value.map((ing: ExtractedIngredient) => ({
    _tempId: generateTempId('form'),
    name: props.activeLocale === 'en' ? ing.name : '',
    amount: typeof ing.amount === 'number' ? ing.amount : parseFloat(ing.amount) || 0,
    unit: ing.unit,
    translations: [
      { locale: 'en' as Locale, name: props.activeLocale === 'en' ? ing.name : '' },
      { locale: 'zh-CN' as Locale, name: props.activeLocale === 'zh-CN' ? ing.name : '' },
    ],
  }))

  emit('import', importedIngredients)
  closeModal()
}

const handleCancel = () => {
  emit('cancel')
  closeModal()
}

const closeModal = () => {
  showConfirmModal.value = false
  clearExtraction()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const closeError = () => {
  clearError()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

onUnmounted(() => {
  clearExtraction()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Upload Area -->
    <div
      :class="[
        'border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer',
        isDragging
          ? 'border-orange-500 bg-orange-50'
          : 'border-gray-300 hover:border-orange-500 hover:bg-gray-50'
      ]"
      role="button"
      tabindex="0"
      :aria-label="t('ocr.uploadScreenshot')"
      @click="triggerFileInput"
      @keydown.enter="triggerFileInput"
      @keydown.space.prevent="triggerFileInput"
      @dragenter.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <div class="text-4xl mb-3" aria-hidden="true">📸</div>
      <p class="text-gray-600 font-medium">{{ t('ocr.uploadScreenshot') }}</p>
      <p class="text-sm text-gray-400 mt-1">{{ t('ocr.supportedFormats') }}</p>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />

    <!-- Loading State -->
    <div v-if="extracting" class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
      <div class="flex items-center justify-center gap-2 text-blue-600">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <span class="text-sm">{{ t('ocr.extracting') }}</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm flex items-start gap-2">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="flex-1">{{ error }}</span>
      <button @click="closeError" class="text-red-500 hover:text-red-700" :aria-label="t('common.close')">
        ✕
      </button>
    </div>

    <!-- Confirmation Bottom Sheet -->
    <BottomSheet
      :visible="showConfirmModal"
      :title="t('ocr.extractedIngredients')"
      :swipeable="true"
      :swipe-threshold="80"
      @close="closeModal"
    >
      <!-- Preview Image -->
      <div v-if="previewImage" class="mb-4">
        <img
          :src="previewImage"
          alt="Uploaded screenshot"
          class="w-full h-32 object-cover rounded-lg"
          loading="lazy"
          decoding="async"
        />
      </div>

      <!-- Extracted Ingredients List -->
      <div v-if="extractedIngredients.length > 0" class="space-y-2">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {{ t('ocr.foundIngredients', { count: extractedIngredients.length }) }}
        </p>
        <div
          v-for="(ing, index) in extractedIngredients"
          :key="index"
          class="flex items-center gap-3 p-2 bg-gray-50 dark:bg-stone-700 rounded-lg text-sm"
        >
          <span class="w-16 text-right font-medium text-orange-600 dark:text-orange-400">
            {{ ing.amount }} {{ ing.unit }}
          </span>
          <span class="flex-1 text-gray-900 dark:text-white">
            {{ ing.name }}
          </span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8 text-gray-500 dark:text-stone-400">
        <p>{{ t('ocr.noIngredientsFound') }}</p>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <button
            type="button"
            @click="closeModal"
            class="flex-1 min-h-[44px] px-4 py-2 bg-gray-200 dark:bg-stone-600 text-gray-700 dark:text-stone-200 rounded-lg hover:bg-gray-300 dark:hover:bg-stone-500 transition-colors"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            v-if="extractedIngredients.length > 0"
            type="button"
            @click="handleImport"
            class="flex-1 min-h-[44px] px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
          >
            {{ t('ocr.importIngredients') }}
          </button>
        </div>
      </template>
    </BottomSheet>
  </div>
</template>
