<script setup lang="ts">
import type { Recipe } from '~/types'

interface Props {
  recipe: Recipe
  qrCodeDataUrl?: string
}

const props = defineProps<Props>()

const {
  POSTER_WIDTH,
  POSTER_HEIGHT,
  totalTime,
  difficultyConfig,
  topIngredients,
  servingsText,
  gradientColors,
  timeText,
  placeholderGradient,
  patternSvg,
} = useSharePosterLogic(props.recipe)
</script>

<template>
  <div
    class="relative overflow-hidden select-none"
    :style="{
      width: `${POSTER_WIDTH}px`,
      height: `${POSTER_HEIGHT}px`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: placeholderGradient,
    }"
  >
    <div class="absolute inset-0 pointer-events-none" :style="{ background: patternSvg }" />
    <div class="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10" />
    <div class="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-white/5" />
    <div class="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/10" />
    <div class="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />

    <div class="relative z-10 flex flex-col h-full p-12">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <div class="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <span class="text-white font-bold text-lg tracking-wide">🍳 食谱</span>
          </div>
        </div>
        <div class="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
          <span class="text-white font-medium">{{ recipe.category }}</span>
        </div>
      </div>

      <div class="relative mb-6 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0" style="height: 480px;">
        <img
          v-if="recipe.imageUrl"
          :src="recipe.imageUrl"
          :alt="recipe.title"
          class="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
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

        <div class="absolute top-4 right-4">
          <span class="px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm" :class="[difficultyConfig.bg, difficultyConfig.text]">
            {{ difficultyConfig.label }}
          </span>
        </div>

        <div class="absolute bottom-4 left-4">
          <span class="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
            ⏱️ {{ timeText }}
          </span>
        </div>

        <div class="absolute bottom-4 right-4">
          <span class="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
            👥 {{ servingsText }}
          </span>
        </div>
      </div>

      <div class="mb-4">
        <h1 class="text-4xl font-bold text-white leading-tight drop-shadow-lg">
          {{ recipe.title }}
        </h1>
        <p v-if="recipe.description" class="text-white/80 text-lg mt-2 line-clamp-2">
          {{ recipe.description }}
        </p>
      </div>

      <div class="bg-white/15 backdrop-blur-md rounded-2xl p-5 mb-4 flex-1">
        <h2 class="text-white font-bold text-xl mb-3 flex items-center gap-2">
          <span>🥗</span> 主要食材
        </h2>
        <div class="grid grid-cols-2 gap-2">
          <div v-for="(ing, idx) in topIngredients" :key="idx" class="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
            <span class="text-white/60 text-xs">{{ ing.amount }}</span>
            <span class="text-white font-medium text-sm">{{ ing.name }}</span>
          </div>
          <div v-if="recipe.ingredients.length > 5" class="bg-white/10 rounded-xl px-4 py-2 flex items-center">
            <span class="text-white/80 text-sm">+{{ recipe.ingredients.length - 5 }} 更多</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between mt-auto pt-2">
        <div class="flex items-center gap-4">
          <div v-if="qrCodeDataUrl" class="bg-white rounded-2xl p-2 shadow-lg">
            <img :src="qrCodeDataUrl" alt="QR Code" class="w-24 h-24 rounded-xl" loading="lazy" />
          </div>
          <div v-else class="bg-white rounded-2xl p-2 shadow-lg">
            <div class="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
              <span class="text-gray-400 text-xs text-center px-2">扫描查看<br>完整食谱</span>
            </div>
          </div>
          <div>
            <div class="text-white font-bold text-lg">🍳 食谱分享</div>
            <div class="text-white/60 text-sm">用 App 发现更多美味</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-white/60 text-xs">扫码阅读</div>
          <div class="text-white font-medium text-sm">{{ recipe.views || 0 }} 次浏览</div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-0 left-0 right-0 h-2" :style="{ background: gradientColors[1] }" />
  </div>
</template>

<!-- Tailwind's line-clamp-2 class handles text truncation -->
