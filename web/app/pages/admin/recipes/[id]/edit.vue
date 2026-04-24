<script setup lang="ts">
import { useAdminRecipeForm } from '~/composables/useAdminRecipeForm'
import AdminRecipeBasicFields from '~/components/admin/AdminRecipeBasicFields.vue'
import AdminRecipeCategoryFields from '~/components/admin/AdminRecipeCategoryFields.vue'
import AdminRecipeTimingFields from '~/components/admin/AdminRecipeTimingFields.vue'
import AdminRecipeIngredients from '~/components/admin/AdminRecipeIngredients.vue'
import AdminRecipeSteps from '~/components/admin/AdminRecipeSteps.vue'
import AdminRecipeTags from '~/components/admin/AdminRecipeTags.vue'
import AdminRecipeNutrition from '~/components/admin/AdminRecipeNutrition.vue'
import AdminRecipeLanguageSwitcher from '~/components/admin/AdminRecipeLanguageSwitcher.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { fetchRecipeById, createRecipe, updateRecipe, loading, fetchCategories, fetchCuisines } = useRecipes()

const isEdit = computed(() => route.params.id !== 'new')

const form = useAdminRecipeForm()

const categoryKeys = ref<Array<{ id: string; name: string; displayName: string }>>([])
const cuisineKeys = ref<Array<{ id: string; name: string; displayName: string }>>([])

onMounted(async () => {
  const [categories, cuisines] = await Promise.all([
    fetchCategories(),
    fetchCuisines(),
  ])
  categoryKeys.value = categories
  cuisineKeys.value = cuisines

  if (isEdit.value) {
    const recipe = await fetchRecipeById(route.params.id as string)
    if (recipe) {
      form.loadRecipe(recipe)
    }
  } else {
    form.initNewMeal()
  }
})

const handleSubmit = async () => {
  if (!form.validate()) return

  const submitData = form.buildSubmitData()
  const success = isEdit.value
    ? await updateRecipe(route.params.id as string, submitData)
    : await createRecipe(submitData)

  if (success) {
    router.push('/admin')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isEdit ? t('admin.editRecipe') : t('admin.newRecipe') }}
          </h1>
          <div class="flex items-center gap-3">
            <AdminRecipeLanguageSwitcher
              v-model:active-locale="form.activeLocale"
            />
            <NuxtLink
              to="/admin"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {{ t('form.cancel') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Validation errors summary -->
      <div
        v-if="Object.keys(form.formErrors).length > 0"
        class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4"
        role="alert"
      >
        <h3 class="text-sm font-semibold text-red-800 mb-2">{{ t('form.validationErrors') || 'Please fix the following errors:' }}</h3>
        <ul class="list-disc list-inside text-sm text-red-700 space-y-1">
          <li v-for="(error, key) in form.formErrors" :key="key">{{ error }}</li>
        </ul>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic fields (title, description) -->
        <AdminRecipeBasicFields
          :form-data="form.formData"
          :current-translation="form.currentTranslation"
          :active-locale="form.activeLocale"
          :errors="form.formErrors"
        />

        <!-- Category and cuisine -->
        <AdminRecipeCategoryFields
          :form-data="form.formData"
          :category-keys="categoryKeys"
          :cuisine-keys="cuisineKeys"
        />

        <!-- Timing and difficulty -->
        <AdminRecipeTimingFields
          :form-data="form.formData"
        />

        <!-- Ingredients -->
        <AdminRecipeIngredients
          :ingredients="form.formData.ingredients"
          :add-ingredient="form.addIngredient"
          :remove-ingredient="form.removeIngredient"
          :get-ingredient-name="form.getIngredientName"
          :set-ingredient-name="form.setIngredientName"
        />

        <!-- Steps -->
        <AdminRecipeSteps
          :steps="form.formData.steps"
          :add-step="form.addStep"
          :remove-step="form.removeStep"
          :get-step-instruction="form.getStepInstruction"
          :set-step-instruction="form.setStepInstruction"
        />

        <!-- Tags -->
        <AdminRecipeTags
          :tags="form.formData.tags"
          :tag-input="form.tagInput"
          @update:tag-input="form.tagInput = $event"
          @add-tag="form.addTag"
          @remove-tag="form.removeTag"
        />

        <!-- Nutrition -->
        <AdminRecipeNutrition
          :nutrition-info="form.formData.nutritionInfo"
        />

        <!-- Submit buttons -->
        <div class="flex justify-end gap-3">
          <NuxtLink
            to="/admin"
            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {{ t('form.cancel') }}
          </NuxtLink>
          <button
            type="submit"
            :disabled="loading"
            class="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? t('form.saving') : (isEdit ? t('form.update') : t('form.save')) }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>
