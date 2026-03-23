<script setup lang="ts">
import type { Locale, IngredientTranslation } from '~/types'

const props = defineProps<{
  ingredients: Array<{
    name: string
    amount: number
    unit: string
    translations: IngredientTranslation[]
  }>
  activeLocale: Locale
}>()

const emit = defineEmits<{
  'update:ingredients': [value: typeof props.ingredients]
}>()

const { t } = useI18n()

const getIngredientName = (index: number) => {
  const ing = props.ingredients[index]
  return ing?.translations?.find((t: IngredientTranslation) => t.locale === props.activeLocale)?.name || ing?.name || ''
}

const setIngredientName = (index: number, value: string) => {
  const newIngredients = [...props.ingredients]
  const ing = newIngredients[index]
  if (!ing) return
  
  const transIndex = ing.translations?.findIndex((t: IngredientTranslation) => t.locale === props.activeLocale) ?? -1
  if (transIndex >= 0 && ing.translations) {
    ing.translations[transIndex].name = value
  } else if (ing.translations) {
    ing.translations.push({ locale: props.activeLocale, name: value })
  }
  if (props.activeLocale === 'en') {
    ing.name = value
  }
  
  emit('update:ingredients', newIngredients)
}

const addIngredient = () => {
  const newIngredients = [...props.ingredients, {
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
  const newIngredients = [...props.ingredients]
  newIngredients.splice(index, 1)
  emit('update:ingredients', newIngredients)
}

const updateAmount = (index: number, value: number) => {
  const newIngredients = [...props.ingredients]
  newIngredients[index].amount = value
  emit('update:ingredients', newIngredients)
}

const updateUnit = (index: number, value: string) => {
  const newIngredients = [...props.ingredients]
  newIngredients[index].unit = value
  emit('update:ingredients', newIngredients)
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900">{{ t('form.ingredients') }}</h2>
      <button
        type="button"
        @click="addIngredient"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        + {{ t('form.addIngredient') }}
      </button>
    </div>

    <div class="space-y-3">
      <div
        v-for="(ingredient, index) in ingredients"
        :key="index"
        class="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 items-start"
      >
        <div class="flex-1 min-w-[100px]">
          <input
            :value="getIngredientName(index)"
            @input="setIngredientName(index, ($event.target as HTMLInputElement).value)"
            type="text"
            :placeholder="t('form.ingredientName')"
            class="w-full px-2 sm:px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm sm:text-base"
          />
        </div>
        <div class="w-16 sm:w-20">
          <input
            :value="ingredient.amount"
            @input="updateAmount(index, Number(($event.target as HTMLInputElement).value))"
            type="number"
            step="0.1"
            min="0"
            :placeholder="t('form.amount')"
            class="w-full px-2 sm:px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm sm:text-base"
          />
        </div>
        <div class="w-16 sm:w-20">
          <input
            :value="ingredient.unit"
            @input="updateUnit(index, ($event.target as HTMLInputElement).value)"
            type="text"
            :placeholder="t('form.unit')"
            class="w-full px-2 sm:px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm sm:text-base"
          />
        </div>
        <button
          type="button"
          @click="removeIngredient(index)"
          class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          :aria-label="t('common.delete')"
        >
          🗑️
        </button>
      </div>
    </div>
  </div>
</template>
