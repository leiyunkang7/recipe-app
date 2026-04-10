import { ref, onUnmounted } from 'vue'

export interface CapturedImage {
  file: File
  dataUrl: string
  base64: string
}

export function useCameraCapture() {
  const stream = ref<MediaStream | null>(null)
  const isActive = ref(false)
  const error = ref<string | null>(null)
  const isLoading = ref(false)

  const videoRef = ref<HTMLVideoElement | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)

  const startCamera = async (videoElement: HTMLVideoElement): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      stream.value = mediaStream
      videoRef.value = videoElement
      videoElement.srcObject = mediaStream
      await videoElement.play()
      isActive.value = true
      return true
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          error.value = 'Camera access denied. Please allow camera permission.'
        } else if (err.name === 'NotFoundError') {
          error.value = 'No camera found on this device.'
        } else {
          error.value = 'Failed to access camera: ' + err.message
        }
      } else {
        error.value = 'Failed to access camera'
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  const stopCamera = () => {
    if (stream.value) {
      stream.value.getTracks().forEach((track) => track.stop())
      stream.value = null
    }
    if (videoRef.value) {
      videoRef.value.srcObject = null
    }
    isActive.value = false
  }

  const _captureImage = (): CapturedImage | null => {
    if (!videoRef.value || !canvasRef.value) {
      error.value = 'Camera not initialized'
      return null
    }

    const video = videoRef.value
    const canvas = canvasRef.value

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      error.value = 'Failed to get canvas context'
      return null
    }

    ctx.drawImage(video, 0, 0)

    // Convert to blob/file
    return new Promise<CapturedImage | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            error.value = 'Failed to capture image'
            resolve(null)
            return
          }

          const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
          const base64 = dataUrl.split(',')[1] || dataUrl

          resolve({
            file,
            dataUrl,
            base64,
          })
        },
        'image/jpeg',
        0.9
      )
    }) as unknown as CapturedImage | null
  }

  const captureImageSync = (): CapturedImage | null => {
    if (!videoRef.value || !canvasRef.value) {
      error.value = 'Camera not initialized'
      return null
    }

    const video = videoRef.value
    const canvas = canvasRef.value

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      error.value = 'Video not ready'
      return null
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      error.value = 'Failed to get canvas context'
      return null
    }

    ctx.drawImage(video, 0, 0)

    // Convert to blob/file
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    const base64 = dataUrl.split(',')[1] || dataUrl
    const blob = dataURLtoBlob(dataUrl)
    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })

    return {
      file,
      dataUrl,
      base64,
    }
  }

  const dataURLtoBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  const clearError = () => {
    error.value = null
  }

  onUnmounted(() => {
    stopCamera()
  })

  return {
    stream,
    isActive,
    error,
    isLoading,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureImage: captureImageSync,
    clearError,
  }
}
