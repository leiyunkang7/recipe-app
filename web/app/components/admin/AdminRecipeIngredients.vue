<script setup lang="ts">
import type { Locale, IngredientTranslation } from '~/types'
import { generateTempId, getTranslation, setTranslation } from '~/utils/form'
import TrashIcon from '~/components/icons/TrashIcon.vue'

interface IngredientWithTempId {
  _tempId?: string
  name: string
  amount: number
  unit: string
  translations: IngredientTranslation[]
}

const props = defineProps<{
  ingredients: IngredientWithTempId[]
  activeLocale: Locale
}>()

const emit = defineEmits<{
  'update:ingredients': [value: IngredientWithTempId[]]
}>()

const { t } = useI18n()

const showImportModal = ref(false)

const getIngredientName = (index: number) => {
  const ing = props.ingredients[index]
  return getTranslation(ing?.translations, props.activeLocale, 'name') || ing?.name || ''
}

const setIngredientName = (index: number, value: string) => {
  const newIngredients = [...props.ingredients]
  const ing = newIngredients[index]
  if (!ing) return

  ing.translations = setTranslation(ing.translations, props.activeLocale, 'name', value)
  if (props.activeLocale === 'en') {
    ing.name = value
  }

  emit('update:ingredients', newIngredients)
}

const addIngredient = () => {
  const newIngredients = [...props.ingredients, {
    _tempId: generateTempId('ing'),
    name: '',
    amount: 0,
    unit: '',
    translations: [
      { locale: 'en' as Locale, name: '' },
      { locale: 'zh-CN' as Locale, name: '' },
    ],
  }]
  emit('update:ingredients', newIngredients)
}

const removeIngredient = (index: number) => {
  const newIngredients = props.ingredients.filter((_, i) => i !== index)
  emit('update:ingredients', newIngredients)
}

const updateAmount = (index: number, value: number) => {
  const newIngredients = [...props.ingredients]
  if (newIngredients[index]) {
    newIngredients[index]!.amount = value
  }
  emit('update:ingredients', newIngredients)
}

const updateUnit = (index: number, value: string) => {
  const newIngredients = [...props.ingredients]
  if (newIngredients[index]) {
    newIngredients[index]!.unit = value
  }
  emit('update:ingredients', newIngredients)
}

const handleImportIngredients = (importedIngredients: IngredientWithTempId[]) => {
  // Add imported ingredients to existing list
  const newIngredients = [...props.ingredients, ...importedIngredients]
  emit('update:ingredients', newIngredients)
  showImportModal.value = false
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-4 sm:p-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <h2 class="text-lg sm:text-xl font-bold text-gray-900">{{ t('form.ingredients') }}</h2>
      <div class="flex gap-2">
        <button
          type="button"
          @click="showImportModal = true"
          aria-label="Import from screenshot"
          class="px-4 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base flex items-center gap-2"
        >
          <span>📸</span>
          <span class="hidden sm:inline">{{ t('ocr.importFromScreenshot') }}</span>
          <span class="sm:hidden">{{ t('ocr.import') }}</span>
        </button>
        <button
          type="button"
          @click="addIngredient"
          aria-label="Add ingredient"
          class="px-4 py-2 min-h-[44px] bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
        >
          + {{ t('form.addIngredient') }}
        </button>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-medium text-blue-900">{{ t('ocr.importFromScreenshot') }}</h3>
        <button
          @click="showImportModal = false"
          class="text-blue-600 hover:text-blue-800"
          :aria-label="t('common.close')"
        >
          ✕
        </button>
      </div>
      <IngredientImport
        :active-locale="activeLocale"
        @import="handleImportIngredients"
        @cancel="showImportModal = false"
      />
    </div>

    <div class="space-y-3">
      <div
        v-for="(ingredient, index) in ingredients"
        :key="ingredient._tempId || index"
        class="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-start"
      >
        <div class="flex-1 min-w-0">
          <input
            :value="getIngredientName(index)"
            @input="setIngredientName(index, ($event.target as HTMLInputElement).value)"
            type="text"
            :placeholder="t('form.ingredientName')"
            class="w-full px-3 py-2 min-h-[44px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm sm:text-base"
          />
        </div>
        <div class="flex gap-2 sm:flex-none sm:flex-col sm:w-20">
          <input
            :value="ingredient.amount"
            @input="updateAmount(index, Number(($event.target as HTMLInputElement).value))"
            type="number"
            step="0.1"
            min="0"
            :placeholder="t('form.amount')"
            class="w-full px-2 sm:px-3 py-2 min-h-[44px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm sm:text-base"
          />
          <input
            :value="ingredient.unit"
            @input="updateUnit(index, ($event.target as HTMLInputElement).value)"
            type="text"
            :placeholder="t('form.unit')"
            class="w-full px-2 sm:px-3 py-2 min-h-[44px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm sm:text-base"
          />
        </div>
        <button
          type="button"
          @click="removeIngredient(index)"
          class="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors self-center sm:self-start"
          :aria-label="t('common.delete')"
        >
          <TrashIcon class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>
