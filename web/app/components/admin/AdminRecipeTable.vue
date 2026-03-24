<script setup lang="ts">
import type { Recipe } from '~/types'
import { DIFFICULTY_CONFIG, getDifficultyLabel } from '~/utils/difficulty'

const props = defineProps<{
  recipes: Recipe[]
  selectedRecipes: string[]
}>()

const emit = defineEmits<{
  toggleSelect: [id: string]
  delete: [id: string]
  edit: [id: string]
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

// Use Set for O(1) lookup instead of O(n) array.includes
const selectedSet = computed(() => new Set(props.selectedRecipes))

const isSelected = (id: string) => selectedSet.value.has(id)

// Pre-computed difficulty class map for O(1) lookup instead of function call per row
const difficultyClassMap = computed(() => {
  const map: Record<string, string> = {}
  for (const key in DIFFICULTY_CONFIG) {
    const config = DIFFICULTY_CONFIG[key as keyof typeof DIFFICULTY_CONFIG]
    if (config) {
      map[key] = `${config.bgClass} ${config.textClass}`
    }
  }
  // Default case
  map[''] = 'bg-gray-100 text-gray-800'
  return map
})

const getDifficultyClass = (difficulty: string) => {
  return difficultyClassMap.value[difficulty] || difficultyClassMap.value['']
}
</script>

<template>
  <!-- Desktop Table -->
  <table class="hidden md:table w-full">
    <thead class="bg-gray-50 border-b border-gray-200">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {{ t('admin.recipe') }}
        </th>
        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {{ t('recipe.category') }}
        </th>
        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {{ t('form.difficulty') }}
        </th>
        <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {{ t('admin.time') }}
        </th>
        <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {{ t('admin.actions') }}
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200">
      <tr
        v-for="recipe in recipes"
        :key="recipe.id"
        v-memo="[recipe.id, recipe.title, recipe.imageUrl, recipe.category, recipe.difficulty, recipe.prepTimeMinutes, recipe.cookTimeMinutes, recipe.description, selectedRecipes.includes(recipe.id.toString())]"
        class="hover:bg-gray-50 transition-colors"
      >
        <td class="px-6 py-4">
          <div class="flex items-center gap-4">
            <input
              type="checkbox"
              :checked="isSelected(recipe.id.toString())"
              @change="emit('toggleSelect', recipe.id.toString())"
              class="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
            >
            <div class="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg overflow-hidden flex-shrink-0">
              <AppImage
                v-if="recipe.imageUrl"
                :src="recipe.imageUrl"
                :alt="recipe.title"
                class="w-full h-full"
                sizes="64px"
                quality="75"
                :object-fit="'cover'"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="text-2xl">🍽️</span>
              </div>
            </div>
            <div>
              <NuxtLink
                :to="localePath(`/admin/recipes/${recipe.id}/edit`, locale)"
                class="text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors"
              >
                {{ recipe.title }}
              </NuxtLink>
              <p v-if="recipe.description" class="text-sm text-gray-600 line-clamp-1 mt-1">
                {{ recipe.description }}
              </p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4">
          <span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            {{ recipe.category }}
          </span>
        </td>
        <td class="px-6 py-4">
          <span
            :class="[
              'px-3 py-1 rounded-full text-xs font-semibold uppercase',
              getDifficultyClass(recipe.difficulty)
            ]"
          >
            {{ getDifficultyLabel(recipe.difficulty) }}
          </span>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">
          {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }} {{ t('recipe.min') }}
        </td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <NuxtLink
              :to="localePath(`/admin/recipes/${recipe.id}/edit`, locale)"
              class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              :title="t('common.edit')"
            >
              ✏️
            </NuxtLink>
            <button
              @click="emit('delete', recipe.id)"
              class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              :title="t('common.delete')"
              :aria-label="t('common.delete')"
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
