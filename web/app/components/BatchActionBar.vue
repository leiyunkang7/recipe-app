<script setup lang="ts">
/**
 * BatchActionBar - Batch action toolbar for favorites management
 *
 * Shows selected count and batch actions:
 * - Move to folder
 * - Remove from favorites
 * - Clear selection
 */
import type { FavoriteFolder } from "~/composables/useFavorites"

interface Props {
  selectedCount: number
  folders: FavoriteFolder[]
  isOperating?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOperating: false,
})

const emit = defineEmits<{
  (e: "move-to-folder", folderId: string | null): void
  (e: "remove", recipeIds: string[]): void
  (e: "clear-selection"): void
}>()

const { t } = useI18n()

const showFolderMenu = ref(false)
const showRemoveConfirm = ref(false)

const handleMoveToFolder = (folderId: string | null) => {
  showFolderMenu.value = false
  emit("move-to-folder", folderId)
}

const handleRemove = () => {
  showRemoveConfirm.value = false
  emit("remove", [])
}

const handleClearSelection = () => {
  emit("clear-selection")
}
</script>

<template>
  <div
    class="fixed bottom-20 left-0 right-0 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 shadow-lg z-40 transition-all duration-300"
  >
    <!-- Selection count -->
    <div class="px-4 py-3 border-b border-stone-100 dark:border-stone-700">
      <p class="text-sm text-stone-600 dark:text-stone-300">
        <span class="font-semibold text-orange-600 dark:text-orange-400">{{ selectedCount }}</span>
        {{ t("favorites.selected") }}
      </p>
    </div>

    <!-- Action buttons -->
    <div class="px-4 py-3 flex items-center justify-between gap-4">
      <!-- Cancel / Clear -->
      <button
        @click="handleClearSelection"
        class="flex items-center gap-2 px-4 py-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
        :disabled="isOperating"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span class="text-sm font-medium">{{ t("favorites.clearSelection") }}</span>
      </button>

      <div class="flex items-center gap-2">
        <!-- Move to Folder -->
        <div class="relative">
          <button
            @click="showFolderMenu = !showFolderMenu"
            class="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            :disabled="isOperating"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span class="text-sm font-medium">{{ t("favorites.moveToFolder") }}</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Folder dropdown menu -->
          <div
            v-if="showFolderMenu"
            class="absolute bottom-full mb-2 right-0 w-56 bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 py-2 z-50"
          >
            <button
              @click="handleMoveToFolder(null)"
              class="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              {{ t("favorites.noFolder") }}
            </button>
            <div v-if="folders.length > 0" class="border-t border-stone-100 dark:border-stone-700 my-1"></div>
            <button
              v-for="folder in folders"
              :key="folder.id"
              @click="handleMoveToFolder(folder.id)"
              class="w-full px-4 py-2 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-2"
            >
              <span
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: folder.color }"
              ></span>
              {{ folder.name }}
            </button>
          </div>
        </div>

        <!-- Remove from Favorites -->
        <button
          @click="showRemoveConfirm = true"
          class="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          :disabled="isOperating"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span class="text-sm font-medium">{{ t("favorites.removeFromFavorites") }}</span>
        </button>
      </div>
    </div>

    <!-- Loading overlay -->
    <div
      v-if="isOperating"
      class="absolute inset-0 bg-white/50 dark:bg-stone-800/50 flex items-center justify-center rounded-lg"
    >
      <svg class="w-6 h-6 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Remove confirmation modal -->
    <Teleport to="body">
      <div
        v-if="showRemoveConfirm"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="showRemoveConfirm = false"
      >
        <div class="bg-white dark:bg-stone-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
          <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
            {{ t("favorites.removeConfirmTitle") }}
          </h3>
          <p class="text-stone-600 dark:text-stone-400 mb-6">
            {{ t("favorites.removeConfirmMessage", { count: selectedCount }) }}
          </p>
          <div class="flex justify-end gap-3">
            <button
              @click="showRemoveConfirm = false"
              class="px-4 py-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              {{ t("common.cancel") }}
            </button>
            <button
              @click="handleRemove"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {{ t("favorites.remove") }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
