/**
 * Web Vitals 监控插件 (web-vitals v0.2.4 兼容)
 * 
 * 功能：
 * - 采集 Core Web Vitals (LCP, CLS, FID/INP, FCP, TTFB)
 * - 生产环境上报到 /api/vitals 端点
 * - 开发环境输出到 console
 * 
 * 注意：
 * - 安装的 web-vitals 版本是 0.2.4 (老版本 API)
 * - 使用 getCLS/getFCP/getFID/getLCP/getTTFB 回调模式
 * - 如需升级到 v3+ API，可运行: npm install web-vitals@latest
 * 
 * 参考：
 * - https://www.npmjs.com/package/web-vitals (v0.2.x)
 */

import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals'

interface VitalMetric {
  name: string
  value: number
  delta: number
  id: string
  rating: 'good' | 'needs-improvement' | 'poor'
}

function getRating(value: number, poor: number, needsImprovement: number): VitalMetric['rating'] {
  if (value <= poor) return 'good'
  if (value <= needsImprovement) return 'needs-improvement'
  return 'poor'
}

function formatValue(value: number): string {
  return Math.round(value === Math.floor(value) ? value : value * 100) / 100 + ''
}

function sendToAnalytics(metric: VitalMetric): void {
  const { name, value, delta, rating } = metric

  const body = {
    name,
    value: Math.round(name === 'CLS' ? delta * 1000 : value),
    rating,
    delta: Math.round(name === 'CLS' ? delta * 1000 : delta),
    id: metric.id,
  }

  // 生产环境
  if (import.meta.prod) {
    fetch('/api/vitals', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
      // 上报失败静默忽略
    })
  } else {
    // 开发环境 console 输出
    const color = rating === 'good' ? '#22c55e' : rating === 'needs-improvement' ? '#eab308' : '#ef4444'
    const label = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '🟡' : '🔴'
    console.log(
      `%c[CWV] ${label} ${name}: ${formatValue(value)} (${rating})`,
      `color: ${color}; font-weight: bold;`,
      { delta: formatValue(delta), id: metric.id.slice(0, 8) }
    )
  }
}

export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  const wrap = (
    getter: (onReport: (metric: VitalMetric) => void) => void,
    name: string,
    poor: number,
    needsImprovement: number
  ) => {
    getter((metric: VitalMetric) => {
      const rating = getRating(
        name === 'CLS' ? metric.delta * 1000 : metric.value,
        name === 'CLS' ? poor * 1000 : poor,
        name === 'CLS' ? needsImprovement * 1000 : needsImprovement
      )
      sendToAnalytics({ ...metric, rating })
    })
  }

  try {
    // CLS (Cumulative Layout Shift) - 累积布局偏移
    wrap(getCLS, 'CLS', 0.25, 0.1)
    // FCP (First Contentful Paint) - 首次内容绘制
    wrap(getFCP, 'FCP', 3800, 1800)
    // FID (First Input Delay) - 首次输入延迟 (已被 INP 取代，但 v0.2.x 仍支持)
    wrap(getFID, 'FID', 300, 100)
    // LCP (Largest Contentful Paint) - 最大内容绘制
    wrap(getLCP, 'LCP', 4000, 2500)
    // TTFB (Time to First Byte) - 首字节时间
    wrap(getTTFB, 'TTFB', 800, 400)
  } catch (err) {
    console.warn('[CWV] Failed to initialize web vitals:', err)
  }
})
