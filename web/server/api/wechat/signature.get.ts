/**
 * WeChat JSSDK Signature API
 *
 * Get signature for WeChat JSSDK initialization
 * 文档: https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html
 */
import { defineEventHandler, getQuery, createError } from 'h3'

// In-memory cache for access_token and jsapi_ticket (in production, use Redis)
let _cachedToken = { value: '', expiresAt: 0 }
let _cachedTicket = { value: '', expiresAt: 0 }

async function getAccessToken(appId: string, appSecret: string): Promise<string> {
  const now = Date.now()
  if (_cachedToken.value && now < _cachedToken.expiresAt) {
    return _cachedToken.value
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
  const response = await fetch(url)
  const data = await response.json() as { access_token?: string; expires_in?: number; errcode?: number; errmsg?: string }

  if (!data.access_token) {
    throw createError({
      statusCode: 500,
      message: `Failed to get access_token: ${data.errmsg || 'unknown error'}`,
    })
  }

  // Cache 90% of expiry time to be safe
  const expiresIn = (data.expires_in || 7200) * 1000
  _cachedToken.value = data.access_token
  _cachedToken.expiresAt = now + expiresIn * 0.9

  return data.access_token
}

async function getJsapiTicket(accessToken: string, _appId: string, _appSecret: string): Promise<string> {
  const now = Date.now()
  if (_cachedTicket.value && now < _cachedTicket.expiresAt) {
    return _cachedTicket.value
  }

  const url = `https://api.weixin.qq.com/cgi-bin/get_jsapi_ticket?access_token=${accessToken}`
  const response = await fetch(url)
  const data = await response.json() as { ticket?: string; expires_in?: number; errcode?: number; errmsg?: string }

  if (!data.ticket) {
    throw createError({
      statusCode: 500,
      message: `Failed to get jsapi_ticket: ${data.errmsg || 'unknown error'}`,
    })
  }

  const expiresIn = (data.expires_in || 7200) * 1000
  _cachedTicket.value = data.ticket
  _cachedTicket.expiresAt = now + expiresIn * 0.9

  return data.ticket
}

async function sha1(str: string): Promise<string> {
  // Use Node.js crypto module for cross-runtime compatibility
  const { createHash } = await import('node:crypto')
  return createHash('sha1').update(str).digest('hex')
}

function generateNonceStr(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const appId = config.public.wechatAppId as string
  const appSecret = config.public.wechatAppSecret as string

  if (!appId || !appSecret) {
    throw createError({
      statusCode: 400,
      message: 'WeChat appId and appSecret must be configured',
    })
  }

  const url = (query.url as string) || ''
  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'url parameter is required',
    })
  }

  // Get access_token and jsapi_ticket
  const accessToken = await getAccessToken(appId, appSecret)
  const jsapiTicket = await getJsapiTicket(accessToken, appId, appSecret)

  // Generate signature
  const timestamp = Math.floor(Date.now() / 1000)
  const nonceStr = generateNonceStr()

  // Sort all parameters and create signature string
  const signatureStr = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`
  const signature = await sha1(signatureStr)

  return {
    appId,
    timestamp,
    nonceStr,
    signature,
  }
})
