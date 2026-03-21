<script setup lang="ts">
import type { Recipe } from '~/types'

interface Props {
  recipe: Recipe
  qrCodeDataUrl?: string
}

const props = defineProps<Props>()

// Poster dimensions (1080x1350 = Instagram portrait 4:5)
const POSTER_WIDTH = 1080
const POSTER_HEIGHT = 1350

const totalTime = computed(() => {
  const prep = Number(props.recipe.prepTimeMinutes) || 0
  const cook = Number(props.recipe.cookTimeMinutes) || 0
  return prep + cook
})

const difficultyConfig = computed(() => {
  switch (props.recipe.difficulty) {
    case 'easy':
      return { label: '简单', bg: 'bg-green-500', text: 'text-white' }
    case 'medium':
      return { label: '中等', bg: 'bg-amber-500', text: 'text-white' }
    case 'hard':
      return { label: '困难', bg: 'bg-red-500', text: 'text-white' }
    default:
      return { label: '未知', bg: 'bg-gray-500', text: 'text-white' }
  }
})

// Get top 5 ingredients for poster
const topIngredients = computed(() => {
  return props.recipe.ingredients.slice(0, 5).map(ing => ({
    name: ing.name,
    amount: `${ing.amount}${ing.unit}`
  }))
})

// Format servings
const servingsText = computed(() => `${props.recipe.servings}人份`)

// Generate gradient background colors based on recipe category
const gradientColors = computed(() => {
  const categoryColors: Record<string, [string, string]> = {
    '家常菜': ['#FF6B35', '#F7C59F'],
    '快手菜': ['#2EC4B6', '#CBF3F0'],
    '甜点': ['#FF69B4', '#FFC1E3'],
    '早餐': ['#FFD93D', '#FFF3B0'],
    '晚餐': ['#6BCB77', '#D4EDDA'],
    '午餐': ['#4D96FF', '#D0E8FF'],
    '饮品': ['#9B5DE5', '#E0C3FC'],
    '零食': ['#F15BB5', '#FCC8E5'],
  }
  const defaultColors = ['#f97316', '#fde68a']
  return categoryColors[props.recipe.category] || defaultColors
})

// Format time
const timeText = computed(() => {
  const mins = totalTime.value
  if (mins >= 60) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
  }
  return `${mins}分钟`
})

// Placeholder image (gradient poster when no image)
const placeholderGradient = computed(() => {
  const [c1, c2] = gradientColors.value
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`
})

// Subtle pattern overlay for texture
const patternSvg = computed(() => {
  return `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
})

// Recipe URL for QR code
const recipeUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/recipes/${props.recipe.id}`
  }
  return `https://recipe-app.example.com/recipes/${props.recipe.id}`
})

// Category badge color
const categoryBgColor = computed(() => {
  const [c1] = gradientColors.value
  return c1
})
</script>

<template>
  <div
    ref="posterRef"
    class="relative overflow-hidden select-none"
    :style="{
      width: `${POSTER_WIDTH}px`,
      height: `${POSTER_HEIGHT}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: placeholderGradient,
    }"
  >
    <!-- Background pattern overlay -->
    <div
      class="absolute inset-0 pointer-events-none"
      :style="{ background: patternSvg }"
    />

    <!-- Decorative top-right circles -->
    <div class="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10" />
    <div class="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-white/5" />

    <!-- Decorative bottom-left circles -->
    <div class="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/10" />
    <div class="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />

    <!-- Main content -->
    <div class="relative z-10 flex flex-col h-full p-12">
      <!-- Header: App branding + Category -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <div class="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <span class="text-white font-bold text-lg tracking-wide">🍳 食谱</span>
          </div>
        </div>
        <div
          class="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
        >
          <span class="text-white font-medium">{{ recipe.category }}</span>
        </div>
      </div>

      <!-- Recipe Image Area -->
      <div class="relative mb-6 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0"
           style="height: 480px;">
        <img
          v-if="recipe.imageUrl"
          :src="recipe.imageUrl"
          :alt="recipe.title"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center"
          :style="{ background: `linear-gradient(135deg, ${gradientColors[0]}cc, ${gradientColors[1]}cc)` }"
        >
          <div class="text-center">
            <div class="text-8xl mb-4">🍽️</div>
            <div class="text-white/80 text-2xl font-medium">{{ recipe.title }}</div>
          </div>
        </div>

        <!-- Difficulty badge overlay -->
        <div class="absolute top-4 right-4">
          <span
            class="px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm"
            :class="[difficultyConfig.bg, difficultyConfig.text]"
          >
            {{ difficultyConfig.label }}
          </span>
        </div>

        <!-- Time badge overlay -->
        <div class="absolute bottom-4 left-4">
          <span class="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
            ⏱️ {{ timeText }}
          </span>
        </div>

        <!-- Servings badge -->
        <div class="absolute bottom-4 right-4">
          <span class="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
            👥 {{ servingsText }}
          </span>
        </div>
      </div>

      <!-- Recipe Title -->
      <div class="mb-4">
        <h1 class="text-4xl font-bold text-white leading-tight drop-shadow-lg">
          {{ recipe.title }}
        </h1>
        <p v-if="recipe.description" class="text-white/80 text-lg mt-2 line-clamp-2">
          {{ recipe.description }}
        </p>
      </div>

      <!-- Ingredients section -->
      <div class="bg-white/15 backdrop-blur-md rounded-2xl p-5 mb-4 flex-1">
        <h2 class="text-white font-bold text-xl mb-3 flex items-center gap-2">
          <span>🥗</span> 主要食材
        </h2>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="(ing, idx) in topIngredients"
            :key="idx"
            class="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2"
          >
            <span class="text-white/60 text-xs">{{ ing.amount }}</span>
            <span class="text-white font-medium text-sm">{{ ing.name }}</span>
          </div>
          <div
            v-if="recipe.ingredients.length > 5"
            class="bg-white/10 rounded-xl px-4 py-2 flex items-center"
          >
            <span class="text-white/80 text-sm">
              +{{ recipe.ingredients.length - 5 }} 更多
            </span>
          </div>
        </div>
      </div>

      <!-- Footer: QR Code + App info -->
      <div class="flex items-center justify-between mt-auto pt-2">
        <div class="flex items-center gap-4">
          <!-- QR Code -->
          <div v-if="qrCodeDataUrl" class="bg-white rounded-2xl p-2 shadow-lg">
            <img :src="qrCodeDataUrl" alt="QR Code" class="w-24 h-24 rounded-xl" />
          </div>
          <div v-else class="bg-white rounded-2xl p-2 shadow-lg">
            <div class="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
              <span class="text-gray-400 text-xs text-center px-2">扫描查看<br>完整食谱</span>
            </div>
          </div>

          <!-- App info -->
          <div>
            <div class="text-white font-bold text-lg">🍳 食谱分享</div>
            <div class="text-white/60 text-sm">用 App 发现更多美味</div>
          </div>
        </div>

        <!-- Stats -->
        <div class="text-right">
          <div class="text-white/60 text-xs">扫码阅读</div>
          <div class="text-white font-medium text-sm">{{ recipe.views || 0 }} 次浏览</div>
        </div>
      </div>
    </div>

    <!-- Bottom decorative line -->
    <div class="absolute bottom-0 left-0 right-0 h-2" :style="{ background: gradientColors[1] }" />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
