/**
 * useWeChatJSSDK - 微信 JSSDK 集成
 *
 * 支持功能:
 * - 分享到朋友 (onMenuShareAppMessage)
 * - 分享到朋友圈 (onMenuShareTimeline)
 * - 分享到收藏 (onMenuShareFavorite)
 * - 隐藏部分微信 UI 元素
 *
 * 使用方式:
 * const { isReady, isInWeChat, initJSSDK, shareToFriend, shareToTimeline } = useWeChatJSSDK()
 */

// Make this file a module so declare global works


// WeChat JSSDK type definitions (official API v1.6.0)
interface WeChatJSSDK {
  config(opts: { debug?: boolean; appId: string; timestamp: number; nonceStr: string; signature: string; jsApiList: string[] }): void
  ready(cb: () => void): void
  error(cb: (err: { errMsg: string }) => void): void
  updateAppMessageShareData(opts: { title: string; desc: string; link: string; imgUrl: string; success?: () => void }): void
  updateTimelineShareData(opts: { title: string; link: string; imgUrl: string; success?: () => void }): void
  onMenuShareTimeline(opts: { title: string; link: string; imgUrl: string; success?: () => void }): void
  onMenuShareAppMessage(opts: { title: string; desc: string; link: string; imgUrl: string; type?: string; success?: () => void }): void
  onMenuShareFavorite(opts: { title: string; desc: string; link: string; imgUrl: string; type?: string; success?: () => void }): void
  hideMenuItems(opts: { menuList: string[] }): void
  showMenuItems(opts: { menuList: string[] }): void
}

/* eslint-disable no-restricted-globals */
declare global {
  interface Window {
    wx: WeChatJSSDK
  }
}
/* eslint-enable no-restricted-globals */

export interface WeChatShareData {
  title: string
  desc: string
  link: string
  imgUrl: string
}

export const useWeChatJSSDK = () => {
  const isReady = ref(false)
  const isInWeChat = ref(false)
  const error = ref<string | null>(null)

  // 检测是否在微信中
  const checkIsInWeChat = (): boolean => {
    if (typeof window === 'undefined') return false
    return /MicroMessenger/i.test(navigator.userAgent)
  }

  // 加载微信 JSSDK 脚本
  const loadWeChatSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 已经加载过
      if (window.wx) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load WeChat JSSDK'))
      document.head.appendChild(script)
    })
  }

  // 获取当前页面 URL (不含 hash)
  const getCurrentUrl = (): string => {
    if (typeof window === 'undefined') return ''
    return window.location.href.split('#')[0]
  }

  // 初始化 JSSDK
  const initJSSDK = async (shareData?: WeChatShareData): Promise<boolean> => {
    if (typeof window === 'undefined') return false

    isInWeChat.value = checkIsInWeChat()
    if (!isInWeChat.value) {
      return false
    }

    try {
      await loadWeChatSDK()

      const currentUrl = getCurrentUrl()
      const signatureData = await $fetch<{
        appId: string
        timestamp: number
        nonceStr: string
        signature: string
      }>('/api/wechat/signature', {
        query: { url: currentUrl },
      })

      const wx = window.wx

      return new Promise((resolve) => {
        wx.config({
          debug: false,
          appId: signatureData.appId,
          timestamp: signatureData.timestamp,
          nonceStr: signatureData.nonceStr,
          signature: signatureData.signature,
          jsApiList: [
            'onMenuShareTimeline',
            'onMenuShareAppMessage',
            'onMenuShareFavorite',
            'updateAppMessageShareData',
            'updateTimelineShareData',
            'hideMenuItems',
            'showMenuItems',
          ],
        })

        wx.ready(() => {
          isReady.value = true
          error.value = null

          // 如果提供了分享数据，立即设置
          if (shareData) {
            configureShare(shareData)
          }

          resolve(true)
        })

        wx.error((err: { errMsg: string }) => {
          error.value = err.errMsg || 'WeChat JSSDK initialization failed'
          isReady.value = false
          console.error('[WeChat JSSDK] config error:', err)
          resolve(false)
        })
      })
    } catch (e) {
      error.value = e.message || 'Failed to initialize WeChat JSSDK'
      console.error('[WeChat JSSDK] init error:', e)
      return false
    }
  }

  // 配置分享内容
  const configureShare = (data: WeChatShareData) => {
    if (typeof window === 'undefined' || !window.wx) return

    const wx = window.wx

    // 新版 API (1.4.0+)
    if (typeof wx.updateAppMessageShareData === 'function') {
      wx.updateAppMessageShareData({
        title: data.title,
        desc: data.desc,
        link: data.link,
        imgUrl: data.imgUrl,
        success: () => {
          console.log('[WeChat JSSDK] updateAppMessageShareData success')
        },
      })
    } else {
      // 旧版 API
      wx.onMenuShareAppMessage({
        title: data.title,
        desc: data.desc,
        link: data.link,
        imgUrl: data.imgUrl,
        type: 'link',
        success: () => {
          console.log('[WeChat JSSDK] onMenuShareAppMessage success')
        },
      })
    }

    // 朋友圈分享
    if (typeof wx.updateTimelineShareData === 'function') {
      wx.updateTimelineShareData({
        title: data.title,
        link: data.link,
        imgUrl: data.imgUrl,
        success: () => {
          console.log('[WeChat JSSDK] updateTimelineShareData success')
        },
      })
    } else {
      wx.onMenuShareTimeline({
        title: data.title,
        link: data.link,
        imgUrl: data.imgUrl,
        success: () => {
          console.log('[WeChat JSSDK] onMenuShareTimeline success')
        },
      })
    }

    // 分享到收藏
    if (typeof wx.onMenuShareFavorite === 'function') {
      wx.onMenuShareFavorite({
        title: data.title,
        desc: data.desc,
        link: data.link,
        imgUrl: data.imgUrl,
        type: 'link',
        success: () => {
          console.log('[WeChat JSSDK] onMenuShareFavorite success')
        },
      })
    }
  }

  // 分享给朋友
  const shareToFriend = (data: WeChatShareData) => {
    if (!isReady.value) {
      console.warn('[WeChat JSSDK] JSSDK not ready, configuring share anyway')
      configureShare(data)
      return
    }
    configureShare(data)
  }

  // 分享到朋友圈
  const shareToTimeline = (data: WeChatShareData) => {
    // Timeline uses the same title (no desc)
    shareToFriend({
      ...data,
      desc: data.title, // WeChat timeline only shows title
    })
  }

  // 隐藏不需要的菜单项
  const hideMenuItems = (items: string[] = ['menuItem:share:qq', 'menuItem:share:weiboApp', 'menuItem:share:QZone']) => {
    if (typeof window === 'undefined' || !window.wx || !isReady.value) return

    const wx = window.wx
    if (typeof wx.hideMenuItems === 'function') {
      wx.hideMenuItems({ menuList: items })
    }
  }

  // 显示分享菜单
  const showShareMenu = () => {
    if (typeof window === 'undefined' || !window.wx || !isReady.value) return

    const wx = window.wx
    if (typeof wx.showMenuItems === 'function') {
      wx.showMenuItems({
        menuList: ['menuItem:share:appMessage', 'menuItem:share:timeline', 'menuItem:share:favorite'],
      })
    }
  }

  return {
    isReady: readonly(isReady),
    isInWeChat: readonly(isInWeChat),
    error: readonly(error),
    initJSSDK,
    configureShare,
    shareToFriend,
    shareToTimeline,
    hideMenuItems,
    showShareMenu,
    checkIsInWeChat,
  }
}
