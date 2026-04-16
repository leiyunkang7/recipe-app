/**
 * WeChat JSSDK Type Declarations
 *
 * Extends the Window interface to include the WeChat JSSDK global object
 */

/* eslint-disable no-restricted-globals */
declare global {
  interface Window {
    // WeChat JSSDK global object
    // See: https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html
    wx: WeChatJSSDK
  }
}
/* eslint-enable no-restricted-globals */

/**
 * WeChat JSSDK type definitions
 * Based on official WeChat JSSDK 1.6.0 API
 */
export interface WeChatJSSDK {
  config(options: WeChatConfigOptions): void
  ready(callback: () => void): void
  error(callback: (err: WeChatError) => void): void
  checkJsApi(options: { jsApiList: string[] }): void
  updateAppMessageShareData(options: WeChatShareOptions): void
  updateTimelineShareData(options: WeChatTimelineShareOptions): void
  onMenuShareTimeline(options: WeChatShareOptions): void
  onMenuShareAppMessage(options: WeChatShareOptions): void
  onMenuShareFavorite(options: WeChatShareOptions): void
  hideMenuItems(options: { menuList: string[] }): void
  showMenuItems(options: { menuList: string[] }): void
  hideAllNonBaseMenuItem(): void
  showAllNonBaseMenuItem(): void
  hideOptionMenu(): void
  showOptionMenu(): void
}

export interface WeChatConfigOptions {
  debug?: boolean
  appId: string
  timestamp: number | string
  nonceStr: string
  signature: string
  jsApiList: string[]
}

export interface WeChatShareOptions {
  title?: string
  desc?: string
  link: string
  imgUrl: string
  type?: 'link' | 'music' | 'video'
  dataUrl?: string
  success?: () => void
  cancel?: () => void
  fail?: (err: any) => void
}

export interface WeChatTimelineShareOptions {
  title?: string
  link?: string
  imgUrl?: string
  success?: () => void
  cancel?: () => void
}

export interface WeChatError {
  errMsg: string
  errCode?: number
}
