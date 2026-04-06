import type { Recipe } from '~/types'

interface PosterOptions {
  width?: number
  height?: number
}

interface QrCodeOptions {
  size: number
  data: string
}

const GRADIENT_COLORS: Record<string, [string, string]> = {
  '家常菜': ['#FF6B35', '#F7C59F'],
  '快手菜': ['#2EC4B6', '#CBF3F0'],
  '甜点': ['#FF69B4', '#FFC1E3'],
  '早餐': ['#FFD93D', '#FFF3B0'],
  '晚餐': ['#6BCB77', '#D4EDDA'],
  '午餐': ['#4D96FF', '#D0E8FF'],
  '饮品': ['#9B5DE5', '#E0C3FC'],
  '零食': ['#F15BB5', '#FCC8E5'],
  '默认': ['#f97316', '#fde68a'],
}

// Simple QR code generator using canvas
// Creates a simple QR-like pattern (for demo purposes, a real QR library would be better)
async function generateQrCode(canvas: HTMLCanvasElement, options: QrCodeOptions): Promise<void> {
  const ctx = canvas.getContext('2d')!
  const { size, data } = options
  const padding = 4
  const dataSize = size - padding * 2

  // Clear
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  // Generate pseudo-QR data from string hash
  const hash = data.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0)
  }, 0)

  const moduleCount = 25 // 25x25 QR-like grid
  const moduleSize = dataSize / moduleCount

  ctx.fillStyle = '#000000'

  // Position patterns (corners)
  const drawFinderPattern = (x: number, y: number) => {
    const size = 7 * moduleSize
    ctx.fillRect(x, y, size, size)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize)
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize)
  }

  drawFinderPattern(padding, padding)
  drawFinderPattern(size - padding - 7 * moduleSize, padding)
  drawFinderPattern(padding, size - padding - 7 * moduleSize)

  // Data modules
  let hashIdx = Math.abs(hash)
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      // Skip finder patterns areas
      if ((row < 8 && col < 8) || (row < 8 && col > moduleCount - 9) || (row > moduleCount - 9 && col < 8)) {
        continue
      }
      // Timing patterns
      if (row === 6 || col === 6) {
        if ((row + col) % 2 === 0) {
          ctx.fillRect(padding + col * moduleSize, padding + row * moduleSize, moduleSize, moduleSize)
        }
        continue
      }
      // Data
      if ((hashIdx + row * col) % 3 === 0) {
        ctx.fillRect(padding + col * moduleSize, padding + row * moduleSize, moduleSize, moduleSize)
      }
      hashIdx = (hashIdx * 31 + row * 7 + col) % 1000000
    }
  }
}

// Convert image URL to image element
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Convert canvas to data URL
function canvasToDataUrl(canvas: HTMLCanvasElement, format: string = 'image/png', quality: number = 0.95): string {
  return canvas.toDataURL(format, quality)
}

export function useSharePoster() {
  const isGenerating = ref(false)
  const error = ref<string | null>(null)

  const generatePoster = async (
    recipe: Recipe,
    qrCodeDataUrl?: string,
    options: PosterOptions = {}
  ): Promise<string> => {
    isGenerating.value = true
    error.value = null

    try {
      const W = options.width || 1080
      const H = options.height || 1350
      const scale = Math.min(W / 1080, H / 1350)

      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)

      const [c1, c2] = GRADIENT_COLORS[recipe.category] || GRADIENT_COLORS['默认']

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1350)
      gradient.addColorStop(0, c1)
      gradient.addColorStop(1, c2)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 1080, 1350)

      // Draw decorative circles
      const drawCircle = (x: number, y: number, r: number, alpha: number) => {
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      drawCircle(1080, 0, 400, 0.1)
      drawCircle(1080, 0, 300, 0.05)
      drawCircle(0, 1350, 360, 0.1)
      drawCircle(0, 1350, 240, 0.05)

      // Header bar
      const headerY = 40
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      roundRect(ctx, 40, headerY, 180, 56, 28)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
      ctx.fillText('🍳 食谱', 68, headerY + 38)

      // Category badge
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      roundRect(ctx, 850, headerY, 190, 56, 28)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = '26px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(recipe.category, 945, headerY + 38)
      ctx.textAlign = 'left'

      // Image area
      const imgY = 130
      const imgH = 480
      const imgR = 24

      // Image placeholder or actual image
      if (recipe.imageUrl) {
        try {
          const img = await loadImage(recipe.imageUrl)
          ctx.save()
          roundRect(ctx, 40, imgY, 1000, imgH, imgR)
          ctx.clip()
          ctx.drawImage(img, 40, imgY, 1000, imgH)
          ctx.restore()
        } catch {
          // Fallback to gradient
          ctx.save()
          roundRect(ctx, 40, imgY, 1000, imgH, imgR)
          ctx.clip()
          const imgGrad = ctx.createLinearGradient(40, imgY, 1040, imgY + imgH)
          imgGrad.addColorStop(0, c1 + 'cc')
          imgGrad.addColorStop(1, c2 + 'cc')
          ctx.fillStyle = imgGrad
          ctx.fillRect(40, imgY, 1000, imgH)
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 48px system-ui, -apple-system, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('🍽️', 540, imgY + 200)
          ctx.font = '32px system-ui, -apple-system, sans-serif'
          ctx.fillText(recipe.title, 540, imgY + 280)
          ctx.textAlign = 'left'
          ctx.restore()
        }
      } else {
        ctx.save()
        roundRect(ctx, 40, imgY, 1000, imgH, imgR)
        ctx.clip()
        const imgGrad = ctx.createLinearGradient(40, imgY, 1040, imgY + imgH)
        imgGrad.addColorStop(0, c1 + 'cc')
        imgGrad.addColorStop(1, c2 + 'cc')
        ctx.fillStyle = imgGrad
        ctx.fillRect(40, imgY, 1000, imgH)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 72px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('🍽️', 540, imgY + 220)
        ctx.font = 'bold 36px system-ui, -apple-system, sans-serif'
        ctx.fillText(recipe.title, 540, imgY + 310)
        ctx.textAlign = 'left'
        ctx.restore()
      }

      // Difficulty badge on image
      const diffConfig: Record<string, { label: string; color: string }> = {
        easy: { label: '简单', color: '#22c55e' },
        medium: { label: '中等', color: '#f59e0b' },
        hard: { label: '困难', color: '#ef4444' },
      }
      const diff = diffConfig[recipe.difficulty] || { label: '未知', color: '#6b7280' }
      const diffY = imgY + 20
      ctx.fillStyle = diff.color
      roundRect(ctx, 940, diffY, 100, 48, 24)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(diff.label, 990, diffY + 32)
      ctx.textAlign = 'left'

      // Time badge
      const totalMins = (Number(recipe.prepTimeMinutes) || 0) + (Number(recipe.cookTimeMinutes) || 0)
      const timeText = totalMins >= 60
        ? `${Math.floor(totalMins / 60)}小时${totalMins % 60 > 0 ? totalMins % 60 + '分钟' : ''}`
        : `${totalMins}分钟`
      const timeY = imgY + imgH - 68
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      roundRect(ctx, 50, timeY, 140, 48, 24)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = '22px system-ui, -apple-system, sans-serif'
      ctx.fillText(`⏱️ ${timeText}`, 65, timeY + 32)

      // Servings badge
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      roundRect(ctx, 850, timeY, 150, 48, 24)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`👥 ${recipe.servings}人份`, 865, timeY + 32)

      // Title
      const titleY = imgY + imgH + 40
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 52px system-ui, -apple-system, sans-serif'
      ctx.fillText(recipe.title, 40, titleY)

      // Description
      if (recipe.description) {
        ctx.font = '24px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        const desc = recipe.description.length > 40 ? recipe.description.slice(0, 40) + '...' : recipe.description
        ctx.fillText(desc, 40, titleY + 40)
      }

      // Ingredients card
      const ingY = titleY + (recipe.description ? 80 : 40)
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      roundRect(ctx, 40, ingY, 1000, 200, 20)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
      ctx.fillText('🥗 主要食材', 65, ingY + 38)

      const topIngs = recipe.ingredients.slice(0, 5)
      const ingCardY = ingY + 50
      const cardW = 465
      const cardH = 52
      const gap = 12

      for (let i = 0; i < topIngs.length; i++) {
        const row = Math.floor(i / 2)
        const col = i % 2
        const x = 65 + col * (cardW + gap)
        const y = ingCardY + row * (cardH + gap)

        ctx.fillStyle = 'rgba(255,255,255,0.1)'
        roundRect(ctx, x, y, cardW, cardH, 12)
        ctx.fill()

        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.font = '18px system-ui, -apple-system, sans-serif'
        ctx.fillText(`${topIngs[i].amount}${topIngs[i].unit}`, x + 16, y + 32)

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
        ctx.fillText(topIngs[i].name, x + 100, y + 33)
      }

      // More indicator
      if (recipe.ingredients.length > 5) {
        const moreY = ingCardY + 2 * (cardH + gap)
        ctx.fillStyle = 'rgba(255,255,255,0.1)'
        roundRect(ctx, 65, moreY, cardW, cardH, 12)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = '22px system-ui, -apple-system, sans-serif'
        ctx.fillText(`+${recipe.ingredients.length - 5} 更多`, 65 + 16, moreY + 33)
      }

      // Footer
      const footerY = 1250

      // QR Code
      const qrCanvas = document.createElement('canvas')
      qrCanvas.width = 120
      qrCanvas.height = 120
      const recipeUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://recipe-app.example.com'}/recipes/${recipe.id}`

      try {
        await generateQrCode(qrCanvas, { size: 120, data: recipeUrl })
      } catch {
        // Draw placeholder QR
        const qCtx = qrCanvas.getContext('2d')!
        qCtx.fillStyle = '#ffffff'
        qCtx.fillRect(0, 0, 120, 120)
        qCtx.fillStyle = '#cccccc'
        qCtx.fillRect(10, 10, 100, 100)
      }

      ctx.fillStyle = '#ffffff'
      roundRect(ctx, 40, footerY, 140, 140, 16)
      ctx.fill()

      // Draw QR on white background
      ctx.drawImage(qrCanvas, 52, footerY + 10, 116, 116)

      // App branding text
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
      ctx.fillText('🍳 食谱分享', 200, footerY + 50)
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '22px system-ui, -apple-system, sans-serif'
      ctx.fillText('用 App 发现更多美味', 200, footerY + 85)

      // Views count
      ctx.textAlign = 'right'
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '18px system-ui, -apple-system, sans-serif'
      ctx.fillText('扫码阅读', 1040, footerY + 40)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
      ctx.fillText(`${recipe.views || 0} 次浏览`, 1040, footerY + 70)
      ctx.textAlign = 'left'

      // Bottom accent line
      const bottomGrad = ctx.createLinearGradient(0, H - 16, W, H)
      bottomGrad.addColorStop(0, c1)
      bottomGrad.addColorStop(1, c2)
      ctx.fillStyle = bottomGrad
      ctx.fillRect(0, H - 16, W, 16)

      return canvasToDataUrl(canvas)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '生成海报失败'
      throw e
    } finally {
      isGenerating.value = false
    }
  }

  const downloadPoster = async (recipe: Recipe, qrCodeDataUrl?: string): Promise<void> => {
    const dataUrl = await generatePoster(recipe, qrCodeDataUrl)
    const link = document.createElement('a')
    link.download = `食谱-${recipe.title}-分享海报.png`
    link.href = dataUrl
    link.click()
  }

  return {
    isGenerating: readonly(isGenerating),
    error: readonly(error),
    generatePoster,
    downloadPoster,
  }
}

// Helper: rounded rectangle path
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
