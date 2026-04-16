<script setup lang="ts">
import type { CreateRecipeDTO } from '@recipe-app/shared-types'

const { t } = useI18n()

interface Props {
  identifiedDish: { dishName: string; cuisine: string; confidence: number }
  recipe: CreateRecipeDTO
  imageDataUrl?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: []; saved: [recipeId: string] }>()

const isSaving = ref(false)
const saveError = ref<string | null>(null)
const isEditing = ref(false)
const editedRecipe = ref<CreateRecipeDTO>({
  ...props.recipe,
  ingredients: props.recipe.ingredients.map(ing => ({ ...ing })),
  steps: props.recipe.steps.map(step => ({ ...step })),
})

const difficultyColor = computed(() => {
  switch (editedRecipe.value.difficulty) {
    case 'easy': return 'text-green-600 dark:text-green-400'
    case 'medium': return 'text-yellow-600 dark:text-yellow-400'
    case 'hard': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
})

const handleSave = async () => {
  isSaving.value = true
  saveError.value = null
  try {
    const result = await $fetch<{ success: boolean; data?: { id: string }; error?: string }>(
      '/api/recipes', { method: 'POST', body: editedRecipe.value }
    )
    if (!result.success) { saveError.value = result.error || 'Failed'; return }
    emit('saved', result.data?.id || '')
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Failed'
  } finally {
    isSaving.value = false
  }
}

const toggleEdit = () => {
  if (isEditing.value) {
    editedRecipe.value = {
      ...props.recipe,
      ingredients: props.recipe.ingredients.map(ing => ({ ...ing })),
      steps: props.recipe.steps.map(step => ({ ...step })),
    }
  }
  isEditing.value = !isEditing.value
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-900 overflow-y-auto">
    <header class="sticky top-0 z-10 bg-white/95 dark:bg-stone-800/95 border-b border-stone-200 dark:border-stone-700">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <button type="button" class="p-2 -ml-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg" @click="$emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
        </button>
        <h1 class="font-semibold text-stone-900 dark:text-white">{{ t('aiRecipe.title') }}</h1>
        <div class="w-10"></div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div class="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-4 border border-orange-200 dark:border-orange-800">
        <div class="flex items-center gap-3">
          <div class="text-4xl">🍽️</div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-semibold text-stone-900 dark:text-white">{{ identifiedDish.dishName }}</h2>
              <span class="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs rounded-full">{{ identifiedDish.cuisine }}</span>
            </div>
            <p class="text-sm text-stone-600 dark:text-stone-400">{{ t('aiRecipe.identified') }} {{ identifiedDish.confidence }}% {{ t('aiRecipe.confidence') }}</p>
          </div>
        </div>
      </div>

      <div v-if="imageDataUrl" class="rounded-2xl overflow-hidden bg-stone-200 dark:bg-stone-700">
        <img :src="imageDataUrl" :alt="identifiedDish.dishName" class="w-full h-64 object-cover" />
      </div>

      <div class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div class="p-4 border-b border-stone-200 dark:border-stone-700 space-y-3">
          <input v-if="!isEditing" v-model="editedRecipe.title" type="text" readonly class="w-full text-xl font-bold text-stone-900 dark:text-white bg-transparent" />
          <input v-else v-model="editedRecipe.title" type="text" class="w-full text-xl font-bold bg-stone-100 dark:bg-stone-700 border rounded-lg px-3 py-2 outline-none focus:border-orange-500" />
          <textarea v-if="isEditing" v-model="editedRecipe.description" rows="2" class="w-full text-sm bg-stone-100 dark:bg-stone-700 border rounded-lg px-3 py-2 outline-none focus:border-orange-500 resize-none"></textarea>
          <p v-else class="text-stone-600 dark:text-stone-400 text-sm">{{ editedRecipe.description }}</p>
          <div class="flex items-center gap-4 text-sm">
            <div class="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" /></svg>
              <span>{{ (editedRecipe.prepTimeMinutes || 0) + (editedRecipe.cookTimeMinutes || 0) }} {{ t('unit.minutes') }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
              <span>{{ editedRecipe.servings }} {{ t('unit.servings') }}</span>
            </div>
            <div :class="['font-medium', difficultyColor]">{{ t(`difficulty.${editedRecipe.difficulty}`) }}</div>
          </div>
        </div>

        <div class="p-4 border-b border-stone-200 dark:border-stone-700">
          <h3 class="font-semibold text-stone-900 dark:text-white mb-3">🥗 {{ t('recipe.ingredients') }}</h3>
          <ul class="space-y-2">
            <li v-for="(ing, i) in editedRecipe.ingredients" :key="i" class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-orange-400"></span>
              <span class="text-stone-700 dark:text-stone-300">
                <template v-if="isEditing">
                  <input v-model="ing.amount" type="number" min="0" step="0.1" class="w-16 px-2 py-1 text-sm bg-stone-100 dark:bg-stone-700 border rounded outline-none" />
                  <input v-model="ing.unit" type="text" class="w-16 px-2 py-1 text-sm bg-stone-100 dark:bg-stone-700 border rounded outline-none mx-1" />
                  <input v-model="ing.name" type="text" class="flex-1 px-2 py-1 text-sm bg-stone-100 dark:bg-stone-700 border rounded outline-none" />
                </template>
                <template v-else><span class="font-medium">{{ ing.amount }}</span> {{ ing.unit }} {{ ing.name }}</template>
              </span>
            </li>
          </ul>
        </div>

        <div class="p-4">
          <h3 class="font-semibold text-stone-900 dark:text-white mb-3">👨‍🍳 {{ t('recipe.steps') }}</h3>
          <ol class="space-y-4">
            <li v-for="(step, i) in editedRecipe.steps" :key="i" class="flex gap-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 text-sm font-medium flex items-center justify-center">{{ i + 1 }}</span>
              <template v-if="isEditing">
                <textarea v-model="step.instruction" rows="2" class="flex-1 px-3 py-2 text-sm bg-stone-100 dark:bg-stone-700 border rounded-lg outline-none resize-none"></textarea>
              </template>
              <p v-else class="text-stone-700 dark:text-stone-300 flex-1">{{ step.instruction }}</p>
            </li>
          </ol>
        </div>
      </div>

      <div v-if="saveError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <p class="text-red-600 dark:text-red-400 text-sm">{{ saveError }}</p>
      </div>
    </main>

    <footer class="sticky bottom-0 bg-white/95 dark:bg-stone-800/95 border-t border-stone-200 dark:border-stone-700">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
        <button type="button" class="flex-1 py-3 px-4 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors" @click="toggleEdit">
          {{ isEditing ? t('aiRecipe.cancelEdit') : t('aiRecipe.edit') }}
        </button>
        <button type="button" class="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2" :disabled="isSaving" @click="handleSave">
          <svg v-if="isSaving" class="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          {{ isSaving ? t('aiRecipe.saving') : t('aiRecipe.save') }}
        </button>
      </div>
    </footer>
  </div>
</template>
