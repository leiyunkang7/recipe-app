import { serverSupabaseClient } from '#supabase/server'

// SVG-based OG image generator
// Returns a properly sized OG image (1200x630) for social media sharing
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Recipe ID is required',
    })
  }

  // Set response headers for image
  setResponseHeaders(event, {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=86400, s-maxage=604800',
  })

  // Fetch recipe from Supabase
  try {
    const supabase = await serverSupabaseClient(event)
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select('title, description, category, difficulty, prepTimeMinutes, cookTimeMinutes, servings, imageUrl')
      .eq('id', id)
      .single()

    if (error || !recipe) {
      return generateFallbackOgSvg(recipe?.title || '食谱')
    }

    return generateOgSvg(recipe)
  } catch (_e) {
    return generateFallbackOgSvg('食谱')
  }
})

interface RecipeForOg {
  title: string
  description?: string
  category?: string
  difficulty?: string
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  servings?: number
  imageUrl?: string
}

function generateOgSvg(recipe: RecipeForOg): string {
  // Color scheme based on category
  const gradientColors: Record<string, { start: string; end: string }> = {
    '家常菜': { start: '#FF6B35', end: '#FF8C5A' },
    '快手菜': { start: '#2EC4B6', end: '#5DD4C8' },
    '甜点': { start: '#FF69B4', end: '#FF8DC7' },
    '早餐': { start: '#FFD93D', end: '#FFE066' },
    '晚餐': { start: '#6BCB77', end: '#8DD896' },
    '午餐': { start: '#4D96FF', end: '#70ABFF' },
    '饮品': { start: '#9B5DE5', end: '#B07AEF' },
    '零食': { start: '#F15BB5', end: '#F47AC7' },
  }

  const colors = gradientColors[recipe.category || '默认'] || { start: '#f97316', end: '#fb923c' }

  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)
  const timeText = totalTime >= 60
    ? `${Math.floor(totalTime / 60)}小时${totalTime % 60 > 0 ? totalTime % 60 + '分钟' : ''}`
    : `${totalTime}分钟`

  const diffConfig: Record<string, { label: string; color: string }> = {
    easy: { label: '简单', color: '#22c55e' },
    medium: { label: '中等', color: '#f59e0b' },
    hard: { label: '困难', color: '#ef4444' },
  }
  const diff = diffConfig[recipe.difficulty || 'medium'] || { label: '中等', color: '#f59e0b' }

  const title = escapeXml(recipe.title.length > 30 ? recipe.title.substring(0, 30) + '...' : recipe.title)
  const desc = recipe.description ? escapeXml(recipe.description.length > 60 ? recipe.description.substring(0, 60) + '...' : recipe.description) : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.start}"/>
      <stop offset="100%" style="stop-color:${colors.end}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.2"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative circles -->
  <circle cx="1200" cy="0" r="400" fill="white" opacity="0.1"/>
  <circle cx="0" cy="630" r="300" fill="white" opacity="0.1"/>

  <!-- Category badge -->
  <rect x="50" y="50" width="160" height="50" rx="25" fill="rgba(255,255,255,0.2)"/>
  <text x="130" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(recipe.category || '食谱')}</text>

  <!-- Difficulty badge -->
  <rect x="1050" y="50" width="100" height="50" rx="25" fill="${diff.color}"/>
  <text x="1100" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">${diff.label}</text>

  <!-- Title -->
  <text x="50" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="bold" fill="white">${title}</text>

  <!-- Description -->
  ${desc ? `<text x="50" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="rgba(255,255,255,0.8)">${desc}</text>` : ''}

  <!-- Time badge -->
  <rect x="50" y="380" width="200" height="45" rx="22" fill="rgba(255,255,255,0.2)"/>
  <text x="70" y="412" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold" fill="white">⏱️ ${timeText}</text>

  <!-- Servings badge -->
  ${recipe.servings ? `
  <rect x="260" y="380" width="150" height="45" rx="22" fill="rgba(255,255,255,0.2)"/>
  <text x="280" y="412" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold" fill="white">👥 ${recipe.servings}人份</text>
  ` : ''}

  <!-- Branding -->
  <text x="50" y="580" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="bold" fill="white">🍳 食谱分享</text>
  <text x="350" y="580" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="rgba(255,255,255,0.6)">扫码阅读完整食谱</text>

  <!-- Bottom accent -->
  <rect x="0" y="610" width="1200" height="20" fill="${colors.start}"/>
</svg>`
}

function generateFallbackOgSvg(title: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#f97316"/>
  <text x="600" y="315" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(title)}</text>
  <text x="600" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="rgba(255,255,255,0.8)" text-anchor="middle">🍳 食谱分享</text>
</svg>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
