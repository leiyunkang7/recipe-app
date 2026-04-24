<script setup lang="ts">
import type { Recipe } from '~/types'

interface Props {
  recipe: Recipe
}

const props = defineProps<Props>()

const {
  showMenu,
  copySuccess,
  platforms,
  shareToPlatform,
  shareToPinterest,
  copyLink,
  toggleMenu,
  closeMenu,
  shareToWeChat,
  shareToInstagram,
} = useShareMenu()
const { trackShare } = useAnalytics()

// 点击外部关闭菜单
const menuRef = ref<HTMLElement | null>(null)

useClickOutside(menuRef, () => {
  closeMenu()
})

const handleCopyLink = async () => {
  await copyLink(props.recipe)
}

const handleShareToPlatform = (platformId: string) => {
  shareToPlatform(props.recipe, platformId)
  trackShare(props.recipe)
}

const handleShareToInstagram = () => {
  shareToInstagram(props.recipe)
  trackShare(props.recipe)
}

const handleShareToPinterest = () => {
  shareToPinterest(props.recipe)
  trackShare(props.recipe)
}

// Compute background color with alpha for better performance
const getPlatformBgStyle = (color: string) => ({ backgroundColor: color + '20' })
</script>

<template>
  <div ref="menuRef" class="relative inline-block">
    <!-- 触发按钮 - 移动端仅显示图标，桌面端显示图标和文字 -->
    <button
      @click.stop="toggleMenu"
      class="min-w-[44px] min-h-[44px] inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors text-sm font-medium active:scale-95 touch-manipulation"
      :aria-label="$t('recipe.share')"
      :aria-expanded="showMenu"
      aria-haspopup="true"
    >
      <span aria-hidden="true">📤</span>
      <span class="hidden sm:inline">{{ $t('recipe.share') }}</span>
    </button>

    <!-- 分享菜单 -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="showMenu"
        class="absolute left-auto right-0 sm:left-auto sm:right-0 mt-2 w-[288px] max-w-[calc(100vw-16px)] sm:max-w-[288px] bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 z-50 overflow-hidden"
      >
        <!-- 标题 -->
        <div class="px-4 py-3 border-b border-stone-200 dark:border-stone-700">
          <p class="text-sm font-semibold text-stone-900 dark:text-stone-100">{{ $t('recipe.shareTo') }}</p>
        </div>

        <!-- 微信分享 -->
        <div class="p-2 border-b border-stone-200 dark:border-stone-700">
          <button
            @click="shareToWeChat(recipe)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            :aria-label="$t('recipe.wechat')"
          >
            <div class="w-10 h-10 rounded-full bg-[#07C160] flex items-center justify-center text-white text-lg">
              <span aria-hidden="true">💚</span>
            </div>
            <div class="text-left">
              <p class="text-sm font-medium text-stone-900 dark:text-stone-100">{{ $t('recipe.wechat') }}</p>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ $t('recipe.wechatTip') }}
              </p>
            </div>
          </button>
        </div>

        <!-- WhatsApp 分享 -->
        <div class="p-2 border-b border-stone-200 dark:border-stone-700">
          <button
            @click="handleShareToPlatform('whatsapp')"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            :aria-label="$t('recipe.whatsapp')"
          >
            <div class="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white text-lg">
              <span aria-hidden="true">📱</span>
            </div>
            <div class="text-left">
              <p class="text-sm font-medium text-stone-900 dark:text-stone-100">{{ $t('recipe.whatsapp') }}</p>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ $t('recipe.whatsappTip') }}
              </p>
            </div>
          </button>
        </div>

        <!-- Telegram 分享 -->
        <div class="p-2 border-b border-stone-200 dark:border-stone-700">
          <button
            @click="handleShareToPlatform('telegram')"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            :aria-label="$t('recipe.telegram')"
          >
            <div class="w-10 h-10 rounded-full bg-[#0088CC] flex items-center justify-center text-white text-lg">
              <span aria-hidden="true">✈️</span>
            </div>
            <div class="text-left">
              <p class="text-sm font-medium text-stone-900 dark:text-stone-100">{{ $t('recipe.telegram') }}</p>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ $t('recipe.telegramTip') }}
              </p>
            </div>
          </button>
        </div>

        <!-- LINE 分享 -->
        <div class="p-2 border-b border-stone-200 dark:border-stone-700">
          <button
            @click="handleShareToPlatform('line')"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            :aria-label="$t('recipe.line')"
          >
            <div class="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center text-white text-lg">
              <span aria-hidden="true">💬</span>
            </div>
            <div class="text-left">
              <p class="text-sm font-medium text-stone-900 dark:text-stone-100">{{ $t('recipe.line') }}</p>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ $t('recipe.lineTip') }}
              </p>
            </div>
          </button>
        </div>

        <!-- Pinterest 分享 - 使用专属分享海报 -->
        <div class="p-2 border-b border-stone-200 dark:border-stone-700">
          <button
            @click="handleShareToPinterest"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            :aria-label="$t('recipe.pinterest')"
          >
            <div class="w-10 h-10 rounded-full bg-[#E60023] flex items-center justify-center text-white text-lg">
              <span aria-hidden="true">📌</span>
            </div>
            <div class="text-left">
              <p class="text-sm font-medium text-stone-900 dark:text-stone-100">{{ $t('recipe.pinterest') }}</p>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ $t('recipe.pinterestTip') }}
              </p>
            </div>
          </button>
        </div>

        <!-- Instagram 分享 - 生成并下载分享海报 -->
        <div class="p-2 border-b border-stone-200 dark:border-stone-700">
          <button
            @click="handleShareToInstagram"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            :aria-label="$t('recipe.instagram')"
          >
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-lg">
              <span aria-hidden="true">📸</span>
            </div>
            <div class="text-left">
              <p class="text-sm font-medium text-stone-900 dark:text-stone-100">{{ $t('recipe.instagram') }}</p>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ $t('recipe.instagramTip') }}
              </p>
            </div>
          </button>
        </div>

        <!-- 复制链接 -->
        <div class="p-2 border-b border-stone-200 dark:border-stone-700">
          <button
            @click="handleCopyLink"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            :aria-label="$t('recipe.copyLink')"
          >
            <div class="w-10 h-10 rounded-full bg-stone-500 flex items-center justify-center text-white text-lg">
              <span aria-hidden="true">🔗</span>
            </div>
            <div class="text-left flex-1">
              <p class="text-sm font-medium text-stone-900 dark:text-stone-100">{{ $t('recipe.copyLink') }}</p>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ copySuccess ? $t('recipe.copySuccess') : $t('recipe.copyLinkTip') }}
              </p>
            </div>
            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 scale-75"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-75"
            >
              <span v-if="copySuccess" aria-hidden="true" class="text-green-500 text-lg">✓</span>
            </Transition>
          </button>
        </div>

        <!-- 社交媒体 -->
        <div class="p-2">
          <p class="px-3 py-2 text-xs text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wider">
            {{ $t('recipe.socialMedia') }}
          </p>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="platform in platforms.filter(p => !['pinterest', 'weibo', 'qq', 'qzone', 'whatsapp', 'telegram', 'line', 'wechat'].includes(p.id))"
              :key="platform.id"
              @click="handleShareToPlatform(platform.id)"
              class="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              :aria-label="platform.name"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                :style="getPlatformBgStyle(platform.color)"
              >
                {{ platform.icon }}
              </div>
              <span class="text-xs text-stone-600 dark:text-stone-400">{{ platform.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
