<template>
  <div class="space-y-4">
    <!-- Image Preview -->
    <div v-if="preview || modelValue" class="relative">
      <img
        :src="preview || modelValue"
        alt="Preview"
        class="w-full h-48 object-cover rounded-lg border border-gray-200"
      />
      <button
        v-if="!uploading"
        @click="clearImage"
        class="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
        :title="t('imageUpload.deleteImage')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Upload Area -->
    <div
      v-else
      :class="[
        'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
        isDragging 
          ? 'border-orange-500 bg-orange-50' 
          : 'border-gray-300 hover:border-orange-500 hover:bg-gray-50'
      ]"
      @click="triggerFileInput"
      @dragenter.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <div class="text-4xl mb-3">📷</div>
      <p class="text-gray-600 font-medium">{{ t('imageUpload.clickOrDrag') }}</p>
      <p class="text-sm text-gray-400 mt-1">{{ t('imageUpload.supportedFormats') }}</p>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />

    <!-- Progress -->
    <div v-if="uploading" class="space-y-2">
      <div class="flex items-center justify-center gap-2 text-orange-600">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
        <span class="text-sm">{{ t('imageUpload.uploading', { progress }) }}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-orange-500 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-start gap-2">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
      <button @click="clearError" class="ml-auto text-red-500 hover:text-red-700">
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { uploading, error, progress, uploadImage, clearError } = useImageUpload()

const preview = ref<string | null>(null)
const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)

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
    error.value = t('imageUpload.imageOnly')
    return
  }

  await processFile(file)
}

const processFile = async (file: File) => {
  // Create preview
  preview.value = URL.createObjectURL(file)

  // Upload
  const url = await uploadImage(file)
  
  if (url) {
    emit('update:modelValue', url)
    preview.value = null
  }
}

const clearImage = () => {
  emit('update:modelValue', '')
  preview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Cleanup preview URL on unmount
onUnmounted(() => {
  if (preview.value) {
    URL.revokeObjectURL(preview.value)
  }
})
</script>
