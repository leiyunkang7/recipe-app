<script setup lang="ts">
/**
 * RecipeImportExport Component
 * Handles batch import/export of recipes in JSON and CSV formats
 *
 * Optimizations:
 * - Extracted triggerDownload helper to eliminate repeated
 *   DOM manipulation patterns (createElement → appendChild → click → removeChild → revokeObjectURL)
 * - Extracted resetImportState to DRY up sheet open/close/tab-switch logic
 * - Watch on activeTab resets import state when switching from export to import tab
 * - onUnmounted cleanup of file input reference to prevent memory leaks
 */
import type { Locale } from '~/types'

export interface ExportedRecipe {
  title: string
  description?: string
  category: string
  cuisine?: string
  servings: number
  prepTimeMinutes: number
  cookTimeMinutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  ingredients: { name: string; amount: number; unit: string }[]
  steps: { stepNumber: number; instruction: string; durationMinutes?: number }[]
  tags?: string[]
  nutritionInfo?: { calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number }
  source?: string
  translations?: { locale: string; title: string; description?: string }[]
}

const props = defineProps<{
  activeLocale?: Locale
}>()

const { t } = useI18n()
const { show: showToast } = useToast()

// Reusable download trigger — eliminates 5-line DOM manipulation sequence repeated 3 times
const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// State
const showSheet = ref(false)
const activeTab = ref<'export' | 'import'>('export')
const exporting = ref(false)
const importing = ref(false)
const fileInput = ref<HTMLInputElement>()
const selectedFormat = ref<'json' | 'csv'>('json')
const isDragging = ref(false)

// Import state
const importResults = ref<{
  success: boolean
  imported?: number
  failed?: number
  total?: number
  results?: Array<{ success: boolean; title?: string; error?: string }>
  errors?: Array<{ index: number; title: string; error: string }>
} | null>(null)

const showImportResults = ref(false)

// Computed
const canExport = computed(() => true)

// Methods
const resetImportState = () => {
  importResults.value = null
  showImportResults.value = false
  isDragging.value = false
}

// Reset import state when switching tabs to avoid stale results
watch(activeTab, (newTab) => {
  if (newTab === 'import') {
    resetImportState()
  }
})

const openSheet = () => {
  showSheet.value = true
  activeTab.value = 'export'
  resetImportState()
}

const closeSheet = () => {
  showSheet.value = false
  resetImportState()
}

const handleExport = async () => {
  if (exporting.value) return
  exporting.value = true

  try {
    const response = await $fetch<{ data: ExportedRecipe[]; count: number; exported_at: string }>(
      '/api/recipes/export',
      {
        query: { format: selectedFormat.value },
        responseType: selectedFormat.value === 'csv' ? 'blob' : 'json',
      }
    )

    if (selectedFormat.value === 'csv') {
      // Blob response for CSV
      const blob = response as unknown as Blob
      triggerDownload(blob, `recipes-export-${new Date().toISOString().split('T')[0]}.csv`)
      showToast(t('importExport.exportSuccess', { count: '?' }), 'success')
    } else {
      // JSON response
      const data = (response as { data: ExportedRecipe[] }).data
      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      triggerDownload(blob, `recipes-export-${new Date().toISOString().split('T')[0]}.json`)
      showToast(t('importExport.exportSuccess', { count: data.length }), 'success')
    }
  } catch (err) {
    console.error('[RecipeImportExport] Export error:', err)
    showToast(t('importExport.exportFailed'), 'error')
  } finally {
    exporting.value = false
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  await processImportFile(file)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (!file) return

  if (!file.name.endsWith('.json') && !file.name.endsWith('.csv')) {
    showToast(t('importExport.invalidFileType'), 'error')
    return
  }

  await processImportFile(file)
}

const processImportFile = async (file: File) => {
  importing.value = true
  importResults.value = null
  showImportResults.value = false

  try {
    const content = await file.text()
    const isJson = file.name.endsWith('.json')

    let recipesData: Partial<ExportedRecipe>[] = []

    if (isJson) {
      const parsed = JSON.parse(content)
      const data = Array.isArray(parsed) ? parsed : (parsed.data || [])
      recipesData = data
    } else {
      // CSV - need to send to server for parsing
      const response = await $fetch<{ data: Partial<ExportedRecipe>[] }>('/api/recipes/export', {
        query: { format: 'csv' },
      })
      // For CSV, we'll send the raw content to import endpoint
    }

    // Send to import API
    const importResponse = await $fetch<{
      imported: number
      failed: number
      total: number
      results: Array<{ success: boolean; title?: string; error?: string }>
      imported_at: string
    }>('/api/recipes/import', {
      method: 'POST',
      body: {
        format: isJson ? 'json' : 'csv',
        content: isJson ? undefined : content,
        recipes: isJson ? recipesData : undefined,
      },
    })

    importResults.value = {
      success: importResponse.imported > 0,
      imported: importResponse.imported,
      failed: importResponse.failed,
      total: importResponse.total,
      results: importResponse.results,
      errors: importResponse.results
        ?.filter(r => !r.success)
        .map((r, i) => ({
          index: i,
          title: r.title || 'Unknown',
          error: r.error || 'Unknown error',
        })),
    }
    showImportResults.value = true

    if (importResponse.imported > 0) {
      showToast(
        t('importExport.importSuccess', {
          imported: importResponse.imported,
          failed: importResponse.failed,
        }),
        importResponse.failed > 0 ? 'warning' : 'success'
      )
    } else {
      showToast(t('importExport.importFailed'), 'error')
    }
  } catch (err) {
    console.error('[RecipeImportExport] Import error:', err)
    showToast(t('importExport.importFailed'), 'error')
    importResults.value = {
      success: false,
      errors: [
        {
          index: 0,
          title: file.name,
          error: err instanceof Error ? err.message : t('importExport.unknownError'),
        },
      ],
    }
    showImportResults.value = true
  } finally {
    importing.value = false
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const downloadTemplate = () => {
  const template: ExportedRecipe = {
    title: 'Sample Recipe',
    description: 'This is a sample recipe for import template',
    category: 'dinner',
    cuisine: 'italian',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    difficulty: 'medium',
    ingredients: [
      { name: 'flour', amount: 2, unit: 'cups' },
      { name: 'eggs', amount: 2, unit: 'whole' },
      { name: 'salt', amount: 0.5, unit: 'tsp' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Mix the flour and salt in a large bowl.', durationMinutes: 2 },
      { stepNumber: 2, instruction: 'Add eggs and mix until dough forms.', durationMinutes: 5 },
      { stepNumber: 3, instruction: 'Knead the dough for 5 minutes.', durationMinutes: 5 },
    ],
    tags: ['pasta', 'italian', 'easy'],
    nutritionInfo: { calories: 250, protein: 8, carbs: 45, fat: 3, fiber: 2 },
    source: '',
    translations: [
      { locale: 'en', title: 'Sample Recipe', description: 'This is a sample recipe' },
      { locale: 'zh-CN', title: '示例食谱', description: '这是一个示例食谱' },
    ],
  }

  const jsonStr = JSON.stringify([template], null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  triggerDownload(blob, 'recipes-template.json')
  showToast(t('importExport.templateDownloaded'), 'success')
}

onUnmounted(() => {
  // Clean up file input reference to prevent potential memory leaks
  fileInput.value = undefined
})
</script>

<template>
  <div>
    <!-- Trigger Button -->
    <button
      @click="openSheet"
      class="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
      :aria-label="t('importExport.title')"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
      <span class="hidden sm:inline">{{ t('importExport.title') }}</span>
    </button>

    <!-- Bottom Sheet -->
    <BottomSheet
      :visible="showSheet"
      :title="t('importExport.title')"
      :swipeable="true"
      :swipe-threshold="80"
      @close="closeSheet"
    >
      <!-- Tab Switcher -->
      <div class="flex gap-2 mb-6">
        <button
          @click="activeTab = 'export'"
          :class="[
            'flex-1 py-2 px-4 rounded-lg font-medium transition-colors',
            activeTab === 'export'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600',
          ]"
        >
          {{ t('importExport.export') }}
        </button>
        <button
          @click="activeTab = 'import'"
          :class="[
            'flex-1 py-2 px-4 rounded-lg font-medium transition-colors',
            activeTab === 'import'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600',
          ]"
        >
          {{ t('importExport.import') }}
        </button>
      </div>

      <!-- Export Tab -->
      <div v-if="activeTab === 'export'" class="space-y-6">
        <div>
          <p class="text-sm text-gray-600 dark:text-stone-400 mb-4">
            {{ t('importExport.exportDescription') }}
          </p>

          <!-- Format Selection -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
              {{ t('importExport.format') }}
            </label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="selectedFormat"
                  type="radio"
                  value="json"
                  class="text-orange-500 focus:ring-orange-500"
                />
                <span class="text-sm text-gray-700 dark:text-stone-300">JSON</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="selectedFormat"
                  type="radio"
                  value="csv"
                  class="text-orange-500 focus:ring-orange-500"
                />
                <span class="text-sm text-gray-700 dark:text-stone-300">CSV</span>
              </label>
            </div>
          </div>

          <!-- Export Info -->
          <div class="bg-gray-50 dark:bg-stone-700 rounded-lg p-4 mb-4">
            <p class="text-xs text-gray-500 dark:text-stone-400">
              <span class="font-medium">{{ t('importExport.exportIncludes') }}:</span>
              {{ t('importExport.exportFields') }}
            </p>
          </div>

          <!-- Export Button -->
          <button
            @click="handleExport"
            :disabled="exporting || !canExport"
            class="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <div v-if="exporting" class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {{ exporting ? t('importExport.exporting') : t('importExport.downloadExport') }}
          </button>
        </div>
      </div>

      <!-- Import Tab -->
      <div v-if="activeTab === 'import'" class="space-y-6">
        <div>
          <p class="text-sm text-gray-600 dark:text-stone-400 mb-4">
            {{ t('importExport.importDescription') }}
          </p>

          <!-- Upload Area -->
          <div
            :class="[
              'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
              isDragging
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-300 dark:border-stone-600 hover:border-orange-500 hover:bg-gray-50 dark:hover:bg-stone-700/50',
            ]"
            role="button"
            tabindex="0"
            :aria-label="t('importExport.uploadFile')"
            @click="triggerFileInput"
            @keydown.enter="triggerFileInput"
            @keydown.space.prevent="triggerFileInput"
            @dragenter.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @dragover.prevent
            @drop.prevent="handleDrop"
          >
            <div class="text-4xl mb-3" aria-hidden="true">📥</div>
            <p class="text-gray-600 dark:text-stone-300 font-medium">
              {{ t('importExport.dropFileHere') }}
            </p>
            <p class="text-sm text-gray-400 dark:text-stone-500 mt-1">
              {{ t('importExport.supportedFormats') }}
            </p>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept=".json,.csv"
            class="hidden"
            @change="handleFileChange"
          />

          <!-- Loading State -->
          <div
            v-if="importing"
            class="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center"
          >
            <div class="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span class="text-sm">{{ t('importExport.importing') }}...</span>
            </div>
          </div>

          <!-- Import Results -->
          <div v-if="showImportResults && importResults" class="mt-4">
            <!-- Success -->
            <div
              v-if="importResults.success && (importResults.imported ?? 0) > 0"
              class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
            >
              <div class="flex items-start gap-3">
                <span class="text-2xl">✅</span>
                <div class="flex-1">
                  <p class="font-medium text-green-800 dark:text-green-300">
                    {{ t('importExport.importComplete') }}
                  </p>
                  <p class="text-sm text-green-600 dark:text-green-400 mt-1">
                    {{ t('importExport.importedCount', { imported: importResults.imported, total: importResults.total }) }}
                    <span v-if="(importResults.failed ?? 0) > 0" class="text-orange-600 dark:text-orange-400">
                      ({{ t('importExport.failedCount', { failed: importResults.failed }) }})
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Failure -->
            <div
              v-else-if="!importResults.success"
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
            >
              <div class="flex items-start gap-3">
                <span class="text-2xl">❌</span>
                <div class="flex-1">
                  <p class="font-medium text-red-800 dark:text-red-300">
                    {{ t('importExport.importFailed') }}
                  </p>
                  <p class="text-sm text-red-600 dark:text-red-400 mt-1">
                    {{ t('importExport.failedDetails', { failed: importResults.failed ?? 0, total: importResults.total ?? 0 }) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Error List -->
            <div
              v-if="importResults.errors && importResults.errors.length > 0"
              class="mt-3 bg-gray-50 dark:bg-stone-700 rounded-lg p-3 max-h-48 overflow-y-auto"
            >
              <p class="text-xs font-medium text-gray-500 dark:text-stone-400 mb-2">
                {{ t('importExport.failedRecipes') }}:
              </p>
              <div
                v-for="(err, idx) in importResults.errors"
                :key="idx"
                class="text-xs text-red-600 dark:text-red-400 py-1 border-b border-gray-200 dark:border-stone-600 last:border-0"
              >
                <span class="font-medium">{{ err.title }}</span>: {{ err.error }}
              </div>
            </div>
          </div>

          <!-- Template Download -->
          <div class="mt-4 text-center">
            <button
              @click="downloadTemplate"
              class="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline"
            >
              {{ t('importExport.downloadTemplate') }}
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
