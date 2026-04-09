<script setup lang="ts">
/**
 * CameraCapture - 拍照识菜相机捕获组件
 *
 * 功能：
 * - 访问设备摄像头
 * - 实时预览摄像头画面
 * - 捕获照片
 * - 支持从相册选择图片
 */
const { t } = useI18n()

const emit = defineEmits<{
  captured: [imageDataUrl: string, base64: string]
  close: []
}>()

const {
  isActive,
  error,
  isLoading,
  videoRef,
  canvasRef,
  startCamera,
  stopCamera,
  captureImage,
  clearError,
} = useCameraCapture()

const videoElementRef = ref<HTMLVideoElement | null>(null)
const hasPhoto = ref(false)
const photoDataUrl = ref<string | null>(null)

const initCamera = async () => {
  if (videoElementRef.value) {
    await startCamera(videoElementRef.value)
  }
}

const handleCapture = () => {
  const captured = captureImage()
  if (captured) {
    photoDataUrl.value = captured.dataUrl
    hasPhoto.value = true
    emit('captured', captured.dataUrl, captured.base64)
  }
}

const handleRetake = () => {
  photoDataUrl.value = null
  hasPhoto.value = false
  clearError()
}

const handleClose = () => {
  stopCamera()
  emit('close')
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || !input.files[0]) return

  const file = input.files[0]
  if (!file.type.startsWith('image/')) {
    clearError()
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    photoDataUrl.value = dataUrl
    hasPhoto.value = true
    const base64 = dataUrl.split(',')[1] || dataUrl
    emit('captured', dataUrl, base64)
  }
  reader.readAsDataURL(file)
}

onMounted(() => {
  initCamera()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
      <button
        type="button"
        class="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        @click="handleClose"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      <h2 class="text-white font-medium">{{ t('camera.title') }}</h2>
      <div class="w-10"></div>
    </div>

    <!-- Camera Preview / Photo Display -->
    <div class="flex-1 relative overflow-hidden">
      <!-- Video (camera active) -->
      <video
        v-show="isActive && !hasPhoto"
        ref="videoElementRef"
        class="absolute inset-0 w-full h-full object-cover"
        autoplay
        playsinline
        muted
      ></video>

      <!-- Hidden canvas for capture -->
      <canvas ref="canvasRef" class="hidden"></canvas>

      <!-- Captured Photo -->
      <div v-if="hasPhoto && photoDataUrl" class="absolute inset-0 flex items-center justify-center bg-black">
        <img
          :src="photoDataUrl"
          alt="Captured photo"
          class="max-w-full max-h-full object-contain"
        />
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black/50">
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          <p class="text-white text-sm">{{ t('camera.accessing') }}</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
        <div class="text-center">
          <div class="text-6xl mb-4">📷</div>
          <p class="text-white text-lg mb-4">{{ error }}</p>
          <button
            type="button"
            class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            @click="initCamera"
          >
            {{ t('camera.retry') }}
          </button>
        </div>
      </div>

      <!-- No Camera Access -->
      <div v-if="!isLoading && !isActive && !hasPhoto && !error" class="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
        <div class="text-center">
          <div class="text-6xl mb-4">🔒</div>
          <p class="text-white text-lg mb-2">{{ t('camera.noAccess') }}</p>
          <p class="text-white/60 text-sm">{{ t('camera.noAccessHint') }}</p>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="p-6 bg-black/50 backdrop-blur-sm">
      <div class="flex items-center justify-center gap-6">
        <!-- Retake (when photo taken) -->
        <button
          v-if="hasPhoto"
          type="button"
          class="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
          @click="handleRetake"
        >
          <div class="w-14 h-14 flex items-center justify-center bg-white/20 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
          </div>
          <span class="text-xs">{{ t('camera.retake') }}</span>
        </button>

        <!-- Capture Button -->
        <button
          v-if="isActive && !hasPhoto"
          type="button"
          class="w-20 h-20 rounded-full bg-white hover:scale-105 transition-transform flex items-center justify-center shadow-lg"
          @click="handleCapture"
        >
          <div class="w-16 h-16 rounded-full border-4 border-gray-300"></div>
        </button>

        <!-- Upload from Gallery -->
        <label
          v-if="!hasPhoto"
          class="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <div class="w-14 h-14 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
            </svg>
          </div>
          <span class="text-xs">{{ t('camera.gallery') }}</span>
          <input
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />
        </label>
      </div>

      <p v-if="!hasPhoto" class="text-center text-white/40 text-xs mt-4">
        {{ t('camera.hint') }}
      </p>
    </div>
  </div>
</template>
