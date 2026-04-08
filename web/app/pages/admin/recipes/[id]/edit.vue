<script setup lang="ts">
import type { Locale, Translation, IngredientTranslation, StepTranslation, NutritionInfo } from '~/types'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const isEdit = computed(() => route.params.id !== 'new')

useSeoMeta({
  title: () => isEdit.value 
    ? `${t('admin.editRecipe')} - ${t('admin.title')}` 
    : `${t('admin.newRecipe')} - ${t('admin.title')}`,
})

const {
  formData,
  categoryKeys,
  cuisineKeys,
  activeLocale,
  tagInput,
  submitError,
  currentTranslation,
  loading,
  initForm,
  addIngredient,
  removeIngredient,
  addStep,
  removeStep,
  addTag,
  removeTag,
  handleSubmit,
} = useRecipeForm()

onMounted(async () => {
  await initForm(route.params.id as string, isEdit.value)
})

const onSubmit = async () => {
  const success = await handleSubmit(route.params.id as string)
  if (success) {
    navigateTo(localePath('/admin', locale.value))
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ isEdit ? `✏️ ${t('admin.editRecipe')}` : `+ ${t('admin.newRecipe')}` }}
            </h1>
          </div>
          <div class="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <NuxtLink
              :to="localePath('/admin', locale)"
              class="min-h-[44px] px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
            >
              {{ t('form.cancel') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ErrorAlert v-if="submitError" :error="submitError" />

      <form @submit.prevent="onSubmit" class="space-y-6">
        <LazyAdminRecipeBasicForm
          v-model:activeLocale="activeLocale"
          v-model:formData="formData"
          :category-keys="categoryKeys"
          :cuisine-keys="cuisineKeys"
          :current-translation="currentTranslation"
        />

        <LazyAdminRecipeIngredients
          v-model:ingredients="formData.ingredients"
          :active-locale="activeLocale"
        />

        <LazyAdminRecipeSteps
          v-model:steps="formData.steps"
          :active-locale="activeLocale"
        />

        <LazyAdminRecipeTags
          v-model:tags="formData.tags"
          v-model:tagInput="tagInput"
          :title="currentTranslation?.title"
          :description="currentTranslation?.description"
          :category="formData.category"
          :cuisine="formData.cuisine"
          :servings="formData.servings"
          :prep-time-minutes="formData.prepTimeMinutes"
          :cook-time-minutes="formData.cookTimeMinutes"
          :difficulty="formData.difficulty"
          :ingredients="formData.ingredients"
          @add-tag="addTag"
          @remove-tag="removeTag"
        />

        <LazyAdminRecipeNutrition
          v-model:nutritionInfo="formData.nutritionInfo"
        />

        <div class="flex flex-col sm:flex-row justify-end gap-3">
          <NuxtLink
            :to="localePath('/admin', locale)"
            class="min-h-[44px] px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
          >
            {{ t('form.cancel') }}
          </NuxtLink>
          <button
            type="submit"
            :disabled="loading"
            class="min-h-[44px] px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {{ loading ? t('form.saving') : (isEdit ? t('form.update') : t('form.save')) }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>
