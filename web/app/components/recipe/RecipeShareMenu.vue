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
  copyLink,
  toggleMenu,
  closeMenu,
  shareToWeChat,
} = useShareMenu()

// 点击外部关闭菜单
const menuRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
      closeMenu()
    }
  }
  document.addEventListener('click', handleClickOutside)
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})

const handleCopyLink = async () => {
  await copyLink(props.recipe)
}

const handleShareToPlatform = (platformId: string) => {
  shareToPlatform(props.recipe, platformId)
}
</script>

<template>
  <div ref="menuRef" class="relative inline-block">
    <!-- 触发按钮 -->
    <button
      @click.stop="toggleMenu"
      class="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors text-sm font-medium"
    >
      <span>📤</span>
      <span>{{ $t('recipe.share') }}</span>
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
        class="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 z-50 overflow-hidden"
      >
        <!-- 标题 -->
        <div class="px-4 py-3 border-b border-stone-200 dark:border-stone-700">
          <p class="text-sm font-semibold text-stone-900 dark:text-stone-100">{{ $t('recipe.shareTo') || '分享到' }}</p>
        </div>

        <!-- 微信分享 -->
        <div class="p-2 border-b border-stone-200 dark:border-stone-700">
          <button
            @click="shareToWeChat(recipe)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          >
            <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-lg">
              💚
            </div>
            <div class="text-left">
              <p class="text-sm font-medium text-stone-900 dark:text-stone-100">{{ $t('recipe.wechat') || '微信' }}</p>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ $t('recipe.wechatTip') || '分享给微信好友' }}
              </p>
            </div>
          </button>
        </div>

        <!-- 复制链接 -->
        <div class="p-2 border-b border-stone-200 dark:border-stone-700">
          <button
            @click="handleCopyLink"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          >
            <div class="w-10 h-10 rounded-full bg-stone-500 flex items-center justify-center text-white text-lg">
              🔗
            </div>
            <div class="text-left flex-1">
              <p class="text-sm font-medium text-stone-900 dark:text-stone-100">{{ $t('recipe.copyLink') || '复制链接' }}</p>
              <p class="text-xs text-stone-500 dark:text-stone-400">
                {{ copySuccess ? ($t('recipe.copySuccess') || '已复制！') : ($t('recipe.copyLinkTip') || '复制链接到剪贴板') }}
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
              <span v-if="copySuccess" class="text-green-500 text-lg">✓</span>
            </Transition>
          </button>
        </div>

        <!-- 社交媒体 -->
        <div class="p-2">
          <p class="px-3 py-2 text-xs text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wider">
            {{ $t('recipe.socialMedia') || '社交媒体' }}
          </p>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="platform in platforms"
              :key="platform.id"
              @click="handleShareToPlatform(platform.id)"
              class="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                :style="{ backgroundColor: platform.color + '20' }"
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
