/**
 * Web Vitals 数据接收端点
 *
 * 接收来自 web-vitals.client.ts 的 CWV 数据
 * 数据存储到 .vitals-data/vitals.json
 */

import { defineEventHandler, readBody, getRequestURL } from 'h3'
import { saveVitalRecord } from '../utils/vitals-storage'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const url = getRequestURL(event)

    // 验证基本格式
    if (!body?.name || typeof body.value !== 'number') {
      throw new Error('Invalid vitals payload')
    }

    // 记录到 server console (可查看实时 CWV)
    console.log(`[CWV-API] ${body.name}: ${body.value} (${body.rating})`, {
      id: body.id?.slice(0, 8),
      delta: body.delta,
    })

    // 保存到文件存储
    await saveVitalRecord({
      name: body.name,
      value: body.value,
      delta: body.delta,
      id: body.id,
      rating: body.rating,
      url: url.pathname,
    })

    return { success: true }
  } catch (err: any) {
    console.error('[CWV-API] Error:', err.message)
    throw createError({ statusCode: 500, message: err.message })
  }
})
