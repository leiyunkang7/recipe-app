<script setup lang="ts">
import { useTagRecommendations } from "~/composables/useTagRecommendations";

const props = defineProps<{
  tags: string[]
  tagInput: string
  title?: string
  description?: string
  category?: string
  cuisine?: string
  servings?: number
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  difficulty?: "easy" | "medium" | "hard"
  ingredients?: Array<{ name: string; amount?: number; unit?: string }>
}>()

const emit = defineEmits<{
  "update:tags": [value: string[]]
  "update:tagInput": [value: string]
  addTag: []
  removeTag: [tag: string]
}>()

const { t } = useI18n()

const {
  recommendedTags,
  isLoading: isLoadingRecommendations,
  showRecommendations,
  fetchRecommendations,
  toggleRecommendation,
} = useTagRecommendations();

function setTags(newTags: string[]) {
  emit("update:tags", newTags);
}

function getRecommendations() {
  fetchRecommendations({
    title: props.title,
    description: props.description,
    category: props.category,
    cuisine: props.cuisine,
    servings: props.servings,
    prepTimeMinutes: props.prepTimeMinutes,
    cookTimeMinutes: props.cookTimeMinutes,
    difficulty: props.difficulty,
    ingredients: props.ingredients,
    existingTags: props.tags,
    maxSuggestions: 10,
  });
}

function isTagSelected(tag: string) {
  return props.tags.includes(tag);
}

function addRecommendedTag(tag: string) {
  toggleRecommendation(tag, props.tags, setTags);
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-4 sm:p-6">
    <h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-4">{{ t('form.tags') }}</h2>
    <div class="flex flex-col sm:flex-row gap-2 mb-4">
      <input
        id="recipe-tags"
        :value="tagInput"
        @input="emit('update:tagInput', ($event.target as HTMLInputElement).value)"
        @keyup.enter="emit('addTag')"
        type="text"
        :placeholder="t('form.tagsPlaceholder')"
        aria-label="Add tag"
        class="flex-1 px-4 py-2 min-h-[44px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-base"
      />
      <button
        type="button"
        @click="emit('addTag')"
        class="px-4 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
      >
        {{ t('form.addTag') }}
      </button>
      <button
        type="button"
        @click="getRecommendations"
        :disabled="isLoadingRecommendations"
        class="px-4 py-2 min-h-[44px] bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <span v-if="isLoadingRecommendations">...</span>
        <span v-else>{{ t('form.getRecommendations') || "Get Recommendations" }}</span>
      </button>
    </div>

    <!-- Recommended Tags Section -->
    <div v-if="showRecommendations && recommendedTags.length > 0" class="mb-4 p-4 bg-blue-50 rounded-lg">
      <h3 class="text-sm font-medium text-gray-700 mb-2">{{ t('form.recommendedTags') || "Recommended Tags" }}</h3>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="suggestion in recommendedTags"
          :key="suggestion.tag"
          @click="addRecommendedTag(suggestion.tag)"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors flex items-center gap-1',
            isTagSelected(suggestion.tag)
              ? 'bg-blue-500 text-white'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          ]"
        >
          <span>{{ suggestion.tag }}</span>
          <span v-if="isTagSelected(suggestion.tag)" class="text-xs">&#10003;</span>
          <span v-else class="text-xs opacity-70">+</span>
        </span>
      </div>
    </div>

    <!-- Existing Tags -->
    <div class="flex flex-wrap gap-2">
      <span
        v-for="tag in tags"
        :key="tag"
        class="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1"
      >
        {{ tag }}
        <button
          type="button"
          @click="emit('removeTag', tag)"
          class="min-w-[32px] min-h-[32px] flex items-center justify-center text-green-600 hover:text-green-800 rounded hover:bg-green-100 transition-colors"
          :aria-label="`Remove ${tag}`"
        >
          ×
        </button>
      </span>
    </div>
  </div>
</template>
