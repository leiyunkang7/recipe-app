<script setup lang="ts">
import type { CreateRecipeDTO } from "@recipe-app/shared-types"
import CloseIcon from "~/components/icons/CloseIcon.vue"
import PencilIcon from "~/components/icons/PencilIcon.vue"
import TrashIcon from "~/components/icons/TrashIcon.vue"
import BookIcon from "~/components/icons/BookIcon.vue"
import CheckIcon from "~/components/icons/CheckIcon.vue"

const { t } = useI18n()

interface IdentifiedDish {
  dishName: string
  cuisine: string
  confidence: number
}

interface Props {
  identifiedDish: IdentifiedDish
  recipe: CreateRecipeDTO
  imageDataUrl?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  saved: [recipeId: string]
}>()

const { saveRecipe } = useAIGeneratedRecipe()

// Use shallowRef for large nested objects to reduce Vue reactivity overhead
// Only the top-level ref tracks changes; nested mutations won't trigger re-renders
const editedRecipe = ref<CreateRecipeDTO>({} as CreateRecipeDTO)
const isEditing = ref(false)
const isSaving = ref(false)
const saveError = ref<string | null>(null)

watch(() => props.recipe, (newRecipe) => {
  editedRecipe.value = {
    ...newRecipe,
    ingredients: newRecipe.ingredients.map(ing => ({ ...ing })),
    steps: newRecipe.steps.map(step => ({ ...step })),
  } as CreateRecipeDTO
  isEditing.value = false
}, { immediate: true })

const totalTime = computed(() => {
  return (editedRecipe.value.prepTimeMinutes || 0) + (editedRecipe.value.cookTimeMinutes || 0)
})

const difficultyOptions = ["easy", "medium", "hard"]

const handleSave = async () => {
  isSaving.value = true
  saveError.value = null
  try {
    const result = await saveRecipe()
    if (result.success && result.recipeId) {
      emit("saved", result.recipeId)
    } else {
      saveError.value = result.error || "Failed to save recipe"
    }
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : "Failed to save recipe"
  } finally {
    isSaving.value = false
  }
}

const handleDiscard = () => emit("close")
const handleClose = () => emit("close")

const addIngredient = () => {
  editedRecipe.value.ingredients.push({ name: "", amount: 0, unit: "" })
}

const removeIngredient = (index: number) => {
  editedRecipe.value.ingredients.splice(index, 1)
}

const updateIngredient = (index: number, field: string, value: string | number) => {
  const ing = editedRecipe.value.ingredients[index]
  if (ing) {
    (ing as Record<string, unknown>)[field] = value
  }
}

const addStep = () => {
  editedRecipe.value.steps.push({ stepNumber: editedRecipe.value.steps.length + 1, instruction: "" })
}

const removeStep = (index: number) => {
  editedRecipe.value.steps.splice(index, 1)
  // Renumber remaining steps
  for (let i = 0; i < editedRecipe.value.steps.length; i++) {
    editedRecipe.value.steps[i]!.stepNumber = i + 1
  }
}

const updateStep = (index: number, field: string, value: string | number) => {
  const step = editedRecipe.value.steps[index]
  if (step) {
    (step as Record<string, unknown>)[field] = value
  }
}

const cancelEdit = () => {
  editedRecipe.value = {
    ...props.recipe,
    ingredients: props.recipe.ingredients.map(ing => ({ ...ing })),
    steps: props.recipe.steps.map(step => ({ ...step })),
  } as CreateRecipeDTO
  isEditing.value = false
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-900 overflow-y-auto">
    <header class="sticky top-0 z-10 bg-white/95 dark:bg-stone-800/95 backdrop-blur-sm border-b border-stone-200 dark:border-stone-700">
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <button type="button" class="p-2 -ml-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors" @click="handleClose">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        <h1 class="text-lg font-semibold text-stone-900 dark:text-white">{{ t("aiRecipe.title") }}</h1>
        <div class="w-10"></div>
      </div>
    </header>
    <main class="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div v-if="imageDataUrl" class="relative rounded-2xl overflow-hidden bg-stone-200 dark:bg-stone-700">
        <img :src="imageDataUrl" :alt="t('aiRecipe.capturedDish')" class="w-full h-64 object-contain" />
      </div>
      <div class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-600 dark:text-orange-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-stone-900 dark:text-white">{{ identifiedDish.dishName }}</h2>
            <p class="text-sm text-stone-500 dark:text-stone-400 mt-1">{{ t("aiRecipe.identified") }} {{ identifiedDish.cuisine }} - {{ (identifiedDish.confidence * 100).toFixed(0) }}% {{ t("aiRecipe.confidence") }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm overflow-hidden">
        <div class="p-4 border-b border-stone-200 dark:border-stone-700">
          <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{{ isEditing ? t('aiRecipe.recipeTitle') : '' }}</label>
          <input v-if="isEditing" v-model="editedRecipe.title" type="text" class="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500" :placeholder="t('aiRecipe.recipeTitlePlaceholder')" />
          <h3 v-else class="text-xl font-semibold text-stone-900 dark:text-white">{{ editedRecipe.title }}</h3>
        </div>
        <div class="p-4 border-b border-stone-200 dark:border-stone-700">
          <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{{ isEditing ? t('aiRecipe.description') : '' }}</label>
          <textarea v-if="isEditing" v-model="editedRecipe.description" rows="3" class="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500" :placeholder="t('aiRecipe.descriptionPlaceholder')"></textarea>
          <p v-else class="text-stone-600 dark:text-stone-400">{{ editedRecipe.description || t('aiRecipe.noDescription') }}</p>
        </div>
        <div class="p-4 border-b border-stone-200 dark:border-stone-700">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs text-stone-500 dark:text-stone-400 mb-1">{{ isEditing ? t('aiRecipe.prepTime') : '' }}</label>
              <input v-if="isEditing" v-model.number="editedRecipe.prepTimeMinutes" type="number" min="0" class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500" />
              <div v-else>
                <p class="text-2xl font-bold text-stone-900 dark:text-white">{{ editedRecipe.prepTimeMinutes }}</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">{{ t('aiRecipe.prepTime') }}</p>
              </div>
            </div>
            <div>
              <label class="block text-xs text-stone-500 dark:text-stone-400 mb-1">{{ isEditing ? t('aiRecipe.cookTime') : '' }}</label>
              <input v-if="isEditing" v-model.number="editedRecipe.cookTimeMinutes" type="number" min="0" class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500" />
              <div v-else>
                <p class="text-2xl font-bold text-stone-900 dark:text-white">{{ editedRecipe.cookTimeMinutes }}</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">{{ t('aiRecipe.cookTime') }}</p>
              </div>
            </div>
            <div>
              <label class="block text-xs text-stone-500 dark:text-stone-400 mb-1">{{ isEditing ? t('aiRecipe.servings') : '' }}</label>
              <input v-if="isEditing" v-model.number="editedRecipe.servings" type="number" min="1" class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500" />
              <div v-else>
                <p class="text-2xl font-bold text-stone-900 dark:text-white">{{ editedRecipe.servings }}</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">{{ t('aiRecipe.servings') }}</p>
              </div>
            </div>
            <div>
              <label class="block text-xs text-stone-500 dark:text-stone-400 mb-1">{{ isEditing ? t('aiRecipe.difficulty') : '' }}</label>
              <select v-if="isEditing" v-model="editedRecipe.difficulty" class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500">
                <option v-for="d in difficultyOptions" :key="d" :value="d">{{ d }}</option>
              </select>
              <div v-else>
                <p class="text-lg font-bold text-stone-900 dark:text-white capitalize">{{ editedRecipe.difficulty }}</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">{{ t('aiRecipe.difficulty') }}</p>
              </div>
            </div>
          </div>
          <div v-if="!isEditing" class="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
            <p class="text-sm text-stone-500 dark:text-stone-400">{{ t('aiRecipe.totalTime', { minutes: totalTime }) }}</p>
          </div>
        </div>

        <div class="p-4 border-b border-stone-200 dark:border-stone-700">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-stone-500 dark:text-stone-400 mb-1">{{ isEditing ? t('aiRecipe.category') : '' }}</label>
              <input v-if="isEditing" v-model="editedRecipe.category" type="text" class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500" :placeholder="t('aiRecipe.categoryPlaceholder')" />
              <p v-else class="text-sm text-stone-600 dark:text-stone-400"><span class="font-medium text-stone-900 dark:text-white">{{ editedRecipe.category || t('aiRecipe.uncategorized') }}</span></p>
            </div>
            <div>
              <label class="block text-xs text-stone-500 dark:text-stone-400 mb-1">{{ isEditing ? t('aiRecipe.cuisine') : '' }}</label>
              <input v-if="isEditing" v-model="editedRecipe.cuisine" type="text" class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500" :placeholder="t('aiRecipe.cuisinePlaceholder')" />
              <p v-else class="text-sm text-stone-600 dark:text-stone-400"><span class="font-medium text-stone-900 dark:text-white">{{ editedRecipe.cuisine || t('aiRecipe.unknown') }}</span></p>
            </div>
          </div>
        </div>
        <div class="p-4 border-b border-stone-200 dark:border-stone-700">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-semibold text-stone-900 dark:text-white">{{ t('aiRecipe.ingredients') }}</h4>
            <button v-if="isEditing" type="button" class="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700" @click="addIngredient">{{ t('aiRecipe.addIngredient') }}</button>
          </div>
          <ul class="space-y-2">
            <li v-for="(ingredient, index) in editedRecipe.ingredients" :key="`ingredient-${ingredient.name}-${index}`" class="flex items-center gap-2">
              <template v-if="isEditing">
                <input v-model.number="ingredient.amount" type="number" step="0.1" min="0" class="w-20 px-2 py-1 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm" :placeholder="t('aiRecipe.ingredientAmount')" @input="updateIngredient(index, 'amount', ($event.target as HTMLInputElement).valueAsNumber)" />
                <input v-model="ingredient.unit" type="text" class="w-20 px-2 py-1 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm" :placeholder="t('aiRecipe.ingredientUnit')" @input="updateIngredient(index, 'unit', ($event.target as HTMLInputElement).value)" />
                <input v-model="ingredient.name" type="text" class="flex-1 px-2 py-1 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm" :placeholder="t('aiRecipe.ingredientName')" @input="updateIngredient(index, 'name', ($event.target as HTMLInputElement).value)" />
                <button type="button" class="p-1 text-red-500 hover:text-red-700" @click="removeIngredient(index)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                </button>
              </template>
              <template v-else>
                <span class="w-16 text-stone-600 dark:text-stone-400">{{ ingredient.amount }} {{ ingredient.unit }}</span>
                <span class="text-stone-900 dark:text-white">{{ ingredient.name }}</span>
              </template>
            </li>
          </ul>
        </div>

        <div class="p-4">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-semibold text-stone-900 dark:text-white">{{ t('aiRecipe.steps') }}</h4>
            <button v-if="isEditing" type="button" class="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700" @click="addStep">{{ t('aiRecipe.addStep') }}</button>
          </div>
          <ol class="space-y-4">
            <li v-for="(step, index) in editedRecipe.steps" :key="`step-${index}-${step.instruction?.slice(0, 20) || 'new'}`" class="flex gap-3">
              <template v-if="isEditing">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-600 flex items-center justify-center">
                  <span class="text-sm font-medium text-stone-700 dark:text-stone-300">{{ index + 1 }}</span>
                </div>
                <div class="flex-1 space-y-2">
                  <textarea v-model="step.instruction" rows="2" class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm" placeholder="Step instruction" @input="updateStep(index, 'instruction', ($event.target as HTMLTextAreaElement).value)"></textarea>
                  <input v-model.number="step.durationMinutes" type="number" min="0" class="w-32 px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm" placeholder="Duration (min)" @input="updateStep(index, 'durationMinutes', ($event.target as HTMLInputElement).valueAsNumber)" />
                  <button type="button" class="text-sm text-red-500 hover:text-red-700" @click="removeStep(index)">Remove step</button>
                </div>
              </template>
              <template v-else>
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <span class="text-sm font-medium text-orange-600 dark:text-orange-400">{{ index + 1 }}</span>
                </div>
                <div class="flex-1">
                  <p class="text-stone-900 dark:text-white">{{ step.instruction }}</p>
                  <p v-if="step.durationMinutes" class="text-sm text-stone-500 dark:text-stone-400 mt-1">{{ step.durationMinutes }} min</p>
                </div>
              </template>
            </li>
          </ol>
        </div>
      </div>

      <div v-if="editedRecipe.nutritionInfo && (editedRecipe.nutritionInfo.calories || editedRecipe.nutritionInfo.protein)" class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
        <h4 class="font-semibold text-stone-900 dark:text-white mb-3">Nutrition (per serving)</h4>
        <div class="grid grid-cols-4 gap-4 text-center">
          <div><p class="text-xl font-bold text-stone-900 dark:text-white">{{ editedRecipe.nutritionInfo.calories || "-" }}</p><p class="text-xs text-stone-500 dark:text-stone-400">Calories</p></div>
          <div><p class="text-xl font-bold text-stone-900 dark:text-white">{{ editedRecipe.nutritionInfo.protein || "-" }}g</p><p class="text-xs text-stone-500 dark:text-stone-400">Protein</p></div>
          <div><p class="text-xl font-bold text-stone-900 dark:text-white">{{ editedRecipe.nutritionInfo.carbs || "-" }}g</p><p class="text-xs text-stone-500 dark:text-stone-400">Carbs</p></div>
          <div><p class="text-xl font-bold text-stone-900 dark:text-white">{{ editedRecipe.nutritionInfo.fat || "-" }}g</p><p class="text-xs text-stone-500 dark:text-stone-400">Fat</p></div>
        </div>
      </div>
      <div v-if="editedRecipe.tags && editedRecipe.tags.length" class="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
        <h4 class="font-semibold text-stone-900 dark:text-white mb-3">Tags</h4>
        <div class="flex flex-wrap gap-2">
          <span v-for="tag in editedRecipe.tags" :key="tag" class="px-3 py-1 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-full text-sm">{{ tag }}</span>
        </div>
      </div>
      <div v-if="saveError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <p class="text-red-600 dark:text-red-400 text-sm">{{ saveError }}</p>
      </div>
      <div class="sticky bottom-0 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 p-4">
        <div class="flex items-center gap-3">
          <template v-if="isEditing">
            <button type="button" class="flex-1 px-4 py-3 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors disabled:opacity-50" :disabled="isSaving" @click="cancelEdit">{{ t("aiRecipe.cancelEdit") }}</button>
            <button type="button" class="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50" :disabled="isSaving" @click="handleSave">{{ isSaving ? t("aiRecipe.saving") : t("aiRecipe.save") }}</button>
          </template>
          <template v-else>
            <button type="button" class="flex-1 px-4 py-3 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors" @click="handleDiscard">{{ t("aiRecipe.discard") }}</button>
            <button type="button" class="flex-1 px-4 py-3 bg-stone-900 dark:bg-stone-600 text-white rounded-xl font-medium hover:bg-stone-800 dark:hover:bg-stone-500 transition-colors" @click="isEditing = true">{{ t("aiRecipe.edit") }}</button>
            <button type="button" class="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors" @click="handleSave">{{ t("aiRecipe.save") }}</button>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>
