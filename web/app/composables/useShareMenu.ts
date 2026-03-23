import type { Recipe } from '~/types'

export interface SharePlatform {
  id: string
  name: string
  icon: string
  color: string
  shareUrl: (url: string, title: string, description?: string) => string
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
]

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

  const shareToPlatform = (recipe: Recipe, platformId: string) => {
    const url = getRecipeUrl(recipe)
    const platform = platforms.find((p) => p.id === platformId)
    if (platform) {
      openShareWindow(platform.shareUrl(url, recipe.title, recipe.description), platform.id)
    }
  }

  const shareAllPlatforms = (recipe: Recipe) => {
    showMenu.value = false
    const url = getRecipeUrl(recipe)
    const title = recipe.title
    const description = recipe.description || ''

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
  const shareToWeChat = (recipe: Recipe) => {
    showMenu.value = false
    if (isWeChat()) {
      // 在微信中，提示用户使用浏览器分享
      alert('请点击右上角「···」按钮，选择「分享到朋友圈」或「发送给朋友」')
    } else {
      // 非微信环境，提示用户打开微信
      alert('请复制链接后，打开微信粘贴发送给好友')
    }
  }

  return {
    showMenu: readonly(showMenu),
    copySuccess: readonly(copySuccess),
    platforms,
    shareToPlatform,
    shareAllPlatforms,
    copyLink,
    toggleMenu,
    closeMenu,
    isWeChat,
    shareToWeChat,
  }
}
