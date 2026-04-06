<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipe: Recipe
}>()

const { t } = useI18n()
const { isGenerating, generatePoster } = useSharePoster()
const toast = useToast()

const show = defineModel<boolean>('show', { default: false })
const posterDataUrl = ref<string | null>(null)

const downloadPosterImage = () => {
  if (!posterDataUrl.value) return
  const link = document.createElement('a')
  link.download = t('recipe.downloadPoster', { title: props.recipe.title })
  link.href = posterDataUrl.value
  link.click()
}

const close = () => {
  show.value = false
}

// Clear cached poster when recipe changes (prevents stale poster for different recipes)
watch(() => props.recipe?.id, (newId, oldId) => {
  if (newId !== oldId) {
    posterDataUrl.value = null
  }
})

// Generate poster when shown (once per open)
watch(show, async (newVal) => {
  if (newVal && !posterDataUrl.value) {
    try {
      posterDataUrl.value = await generatePoster(props.recipe)
    } catch (e) {
      toast.error(t('recipe.posterError'))
      close()
    }
  }
}, { once: true })
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="close"
      >
        <div class="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
            <h3 class="text-lg font-bold text-stone-900 dark:text-stone-100">{{ t('recipe.sharePoster') }}</h3>
            <button
              @click="close"
              class="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors"
            >
              <svg class="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="p-4">
            <div v-if="isGenerating" class="flex flex-col items-center justify-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
              <p class="text-stone-500">{{ t('recipe.generatingPoster') }}</p>
            </div>
            <div v-else-if="posterDataUrl" class="space-y-4">
              <NuxtImg
                :src="posterDataUrl"
                alt="Share Poster"
                class="w-full rounded-lg shadow-md"
                loading="lazy"
                decoding="async"
                format="webp"
              />
              <button
                @click="downloadPosterImage"
                class="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 px-4 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                <span class="text-xl">📥</span>
                <span>{{ t('common.download') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
