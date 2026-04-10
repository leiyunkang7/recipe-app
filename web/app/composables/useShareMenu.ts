import type { Recipe } from '~/types'

export interface SharePlatform {
  id: string
  name: string
  icon: string
  color: string
  shareUrl: (url: string, title: string, description?: string, imageUrl?: string) => string
}

// Static platform configuration - created once, shared across all composable calls
const PLATFORMS: SharePlatform[] = [
  {
    id: 'weibo',
    name: '微博',
    icon: '📱',
    color: '#E6162D',
    shareUrl: (url, title, description) =>
      `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title + (description ? ' - ' + description : ''))}`,
  },
  {
    id: 'qq',
    name: 'QQ',
    icon: '💬',
    color: '#12B7F5',
    shareUrl: (url, title, description) =>
      `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description || '')}`,
  },
  {
    id: 'qzone',
    name: 'QQ空间',
    icon: '🌐',
    color: '#FDC830',
    shareUrl: (url, title, description) =>
      `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description || '')}`,
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '🐦',
    color: '#000000',
    shareUrl: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    shareUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    color: '#E60023',
    shareUrl: (url, title, _description, imageUrl) => {
      const params = new URLSearchParams({
        url,
        description: title,
      })
      if (imageUrl) {
        params.set('media', imageUrl)
      }
      return `https://pinterest.com/pin/create/button/?${params.toString()}`
    },
  },
]

// O(1) platform lookup Map - avoids O(n) find() on each share action
const PLATFORM_MAP = new Map(PLATFORMS.map((p) => [p.id, p]))

export const useShareMenu = () => {
  const showMenu = ref(false)
  const copySuccess = ref(false)

  const platforms = PLATFORMS

  const getRecipeUrl = (recipe: Recipe): string => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/recipes/${recipe.id}`
    }
    return `https://recipe-app.example.com/recipes/${recipe.id}`
  }

  const openShareWindow = (url: string, platform: string) => {
    if (typeof window === 'undefined') return
    const width = 600
    const height = 500
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2
    window.open(
      url,
      platform,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=no`
    )
  }

  const shareToPlatform = (recipe: Recipe, platformId: string, posterDataUrl?: string) => {
    const url = getRecipeUrl(recipe)
    // Use Map for O(1) lookup instead of O(n) find()
    const platform = PLATFORM_MAP.get(platformId)
    if (platform) {
      // For Pinterest, prefer the share poster image over the recipe image
      const imageUrl = platformId === 'pinterest' && posterDataUrl
        ? posterDataUrl
        : recipe.imageUrl
      openShareWindow(platform.shareUrl(url, recipe.title, recipe.description, imageUrl), platform.id)
    }
  }

  const shareToPinterest = async (recipe: Recipe) => {
    showMenu.value = false
    const toast = useToast()

    try {
      // Generate share poster for better Pinterest sharing
      const { generatePoster } = useSharePoster()
      const posterDataUrl = await generatePoster(recipe)

      // Open Pinterest share window with the poster image
      const url = getRecipeUrl(recipe)
      const params = new URLSearchParams({
        url,
        description: recipe.title,
        media: posterDataUrl,
      })
      openShareWindow(`https://pinterest.com/pin/create/button/?${params.toString()}`, 'pinterest')
    } catch (_e) {
      // Fallback to basic Pinterest sharing
      toast.error('生成分享图片失败，使用基本链接分享')
      shareToPlatform(recipe, 'pinterest')
    }
  }

  const shareAllPlatforms = (recipe: Recipe) => {
    showMenu.value = false
    const url = getRecipeUrl(recipe)

    // 复制链接
    navigator.clipboard.writeText(url).then(() => {
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
    })
  }

  const copyLink = async (recipe: Recipe): Promise<boolean> => {
    const url = getRecipeUrl(recipe)
    try {
      await navigator.clipboard.writeText(url)
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
      return true
    } catch {
      return false
    }
  }

  const toggleMenu = () => {
    showMenu.value = !showMenu.value
  }

  const closeMenu = () => {
    showMenu.value = false
  }

  // 检测是否在微信中
  const isWeChat = (): boolean => {
    if (typeof window === 'undefined') return false
    return /MicroMessenger/i.test(navigator.userAgent)
  }

  // 微信分享提示（微信中需要使用 JSSDK）
  const shareToWeChat = (_recipe: Recipe) => {
    showMenu.value = false
    const toast = useToast()
    if (isWeChat()) {
      // 在微信中，提示用户使用浏览器分享
      toast.info('请点击右上角「···」按钮，选择「分享到朋友圈」或「发送给朋友」')
    } else {
      // 非微信环境，提示用户打开微信
      toast.info('请复制链接后，打开微信粘贴发送给好友')
    }
  }

  // Instagram分享 - Instagram不支持网页直接分享，需要生成海报并下载
  const shareToInstagram = async (recipe: Recipe) => {
    showMenu.value = false
    const toast = useToast()
    const { t: _t } = useI18n()

    try {
      // Generate share poster for Instagram
      const { generatePoster } = useSharePoster()
      const posterDataUrl = await generatePoster(recipe)

      // Download the poster image
      const link = document.createElement('a')
      link.download = `${recipe.title}-分享海报.png`
      link.href = posterDataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Show instructions for Instagram sharing
      toast.success('图片已下载！现在打开 Instagram App 分享这道美味食谱')

      // Try to detect mobile and open Instagram
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isMobile) {
        // Try to open Instagram app (may not work on all devices)
        const _instagramUrl = 'instagram://app'
        setTimeout(() => {
          // Don't force redirect, just show instructions
        }, 500)
      }
    } catch (__e) {
      // Fallback: copy image URL if available
      if (recipe.imageUrl) {
        try {
          await navigator.clipboard.writeText(recipe.imageUrl)
          toast.info('图片链接已复制，请打开 Instagram App 手动分享')
        } catch {
          toast.error('无法生成分享图片，请手动保存食谱图片后分享')
        }
      } else {
        toast.error('无法生成分享图片，请手动保存食谱图片后分享')
      }
    }
  }

  return {
    showMenu: readonly(showMenu),
    copySuccess: readonly(copySuccess),
    platforms,
    shareToPlatform,
    shareToPinterest,
    shareAllPlatforms,
    copyLink,
    toggleMenu,
    closeMenu,
    isWeChat,
    shareToWeChat,
    shareToInstagram,
  }
}
