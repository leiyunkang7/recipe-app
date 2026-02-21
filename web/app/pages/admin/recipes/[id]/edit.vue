<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes'

const route = useRoute()
const router = useRouter()
const { fetchRecipeById, createRecipe, updateRecipe, loading, fetchCategories, fetchCuisines } = useRecipes()

const isEdit = computed(() => route.params.id !== 'new')

const categories = ref<string[]>([])
const cuisines = ref<string[]>([])

const formData = ref({
  title: '',
  description: '',
  category: '',
  cuisine: '',
  servings: 4,
  prepTimeMinutes: 30,
  cookTimeMinutes: 30,
  difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  imageUrl: '',
  source: '',
  tags: [] as string[],
  nutritionInfo: {
    calories: undefined as number | undefined,
    protein: undefined as number | undefined,
    carbs: undefined as number | undefined,
    fat: undefined as number | undefined,
    fiber: undefined as number | undefined,
  },
  ingredients: [] as Array<{ name: string; amount: number; unit: string }>,
  steps: [] as Array<{ stepNumber: number; instruction: string; durationMinutes?: number }>,
})

const tagInput = ref('')

onMounted(async () => {
  categories.value = await fetchCategories()
  cuisines.value = await fetchCuisines()

  if (isEdit.value) {
    const recipe = await fetchRecipeById(route.params.id as string)
    if (recipe) {
      formData.value = {
        title: recipe.title,
        description: recipe.description || '',
        category: recipe.category,
        cuisine: recipe.cuisine || '',
        servings: recipe.servings,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        difficulty: recipe.difficulty,
        imageUrl: recipe.imageUrl || '',
        source: recipe.source || '',
        tags: recipe.tags || [],
        nutritionInfo: recipe.nutritionInfo || {},
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
      }
    }
  } else {
    // Add default ingredient and step for new recipes
    addIngredient()
    addStep()
  }
})

const addIngredient = () => {
  formData.value.ingredients.push({ name: '', amount: 0, unit: '' })
}

const removeIngredient = (index: number) => {
  formData.value.ingredients.splice(index, 1)
}

const addStep = () => {
  const nextStepNumber = formData.value.steps.length + 1
  formData.value.steps.push({
    stepNumber: nextStepNumber,
    instruction: '',
    durationMinutes: undefined,
  })
}

const removeStep = (index: number) => {
  formData.value.steps.splice(index, 1)
  // Renumber steps
  formData.value.steps.forEach((step, i) => {
    step.stepNumber = i + 1
  })
}

const addTag = () => {
  if (tagInput.value.trim() && !formData.value.tags.includes(tagInput.value.trim())) {
    formData.value.tags.push(tagInput.value.trim())
    tagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  const index = formData.value.tags.indexOf(tag)
  if (index > -1) {
    formData.value.tags.splice(index, 1)
  }
}

const handleSubmit = async () => {
  const success = isEdit.value
    ? await updateRecipe(route.params.id as string, formData.value)
    : await createRecipe(formData.value)

  if (success) {
    router.push('/admin')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ isEdit ? '✏️ Edit Recipe' : '+ Create Recipe' }}
            </h1>
          </div>
          <NuxtLink
            to="/admin"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic Info -->
        <div class="bg-white rounded-xl shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                v-model="formData.title"
                type="text"
                required
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Recipe title"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                v-model="formData.description"
                rows="3"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Brief description"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                v-model="formData.category"
                required
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Select category</option>
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Cuisine
              </label>
              <select
                v-model="formData.cuisine"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Select cuisine</option>
                <option v-for="cuisine in cuisines" :key="cuisine" :value="cuisine">
                  {{ cuisine }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Servings *
              </label>
              <input
                v-model.number="formData.servings"
                type="number"
                min="1"
                required
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Difficulty *
              </label>
              <select
                v-model="formData.difficulty"
                required
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Prep Time (minutes) *
              </label>
              <input
                v-model.number="formData.prepTimeMinutes"
                type="number"
                min="0"
                required
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Cook Time (minutes) *
              </label>
              <input
                v-model.number="formData.cookTimeMinutes"
                type="number"
                min="0"
                required
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                v-model="formData.imageUrl"
                type="url"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Source URL
              </label>
              <input
                v-model="formData.source"
                type="url"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="https://example.com/recipe"
              />
            </div>
          </div>
        </div>

        <!-- Ingredients -->
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900">Ingredients</h2>
            <button
              type="button"
              @click="addIngredient"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Add Ingredient
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(ingredient, index) in formData.ingredients"
              :key="index"
              class="flex gap-3 items-start"
            >
              <div class="flex-1">
                <input
                  v-model="ingredient.name"
                  type="text"
                  placeholder="Ingredient name"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              <div class="w-24">
                <input
                  v-model.number="ingredient.amount"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Amount"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              <div class="w-24">
                <input
                  v-model="ingredient.unit"
                  type="text"
                  placeholder="Unit"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              <button
                type="button"
                @click="removeIngredient(index)"
                class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <!-- Steps -->
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900">Instructions</h2>
            <button
              type="button"
              @click="addStep"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Add Step
            </button>
          </div>

          <div class="space-y-4">
            <div
              v-for="(step, index) in formData.steps"
              :key="index"
              class="flex gap-3 items-start"
            >
              <span class="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm mt-2">
                {{ step.stepNumber }}
              </span>
              <div class="flex-1 space-y-2">
                <textarea
                  v-model="step.instruction"
                  rows="2"
                  placeholder="Step instruction"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
                <input
                  v-model.number="step.durationMinutes"
                  type="number"
                  min="0"
                  placeholder="Duration (minutes, optional)"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              <button
                type="button"
                @click="removeStep(index)"
                class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div class="bg-white rounded-xl shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Tags</h2>
          <div class="flex gap-2 mb-4">
            <input
              v-model="tagInput"
              @keyup.enter="addTag"
              type="text"
              placeholder="Add tag and press Enter"
              class="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
            <button
              type="button"
              @click="addTag"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in formData.tags"
              :key="tag"
              class="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {{ tag }}
              <button
                type="button"
                @click="removeTag(tag)"
                class="text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          </div>
        </div>

        <!-- Nutrition Info -->
        <div class="bg-white rounded-xl shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Nutrition Information (Optional)</h2>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Calories</label>
              <input
                v-model.number="formData.nutritionInfo.calories"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Protein (g)</label>
              <input
                v-model.number="formData.nutritionInfo.protein"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Carbs (g)</label>
              <input
                v-model.number="formData.nutritionInfo.carbs"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fat (g)</label>
              <input
                v-model.number="formData.nutritionInfo.fat"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fiber (g)</label>
              <input
                v-model.number="formData.nutritionInfo.fiber"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <NuxtLink
            to="/admin"
            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </NuxtLink>
          <button
            type="submit"
            :disabled="loading"
            class="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Saving...' : (isEdit ? 'Update Recipe' : 'Create Recipe') }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>
