<script setup lang="ts">
import type { FavoriteFolder } from '~/composables/useFavorites'

const props = defineProps<{
  folder: FavoriteFolder
}>()

const emit = defineEmits<{
  rename: [folderId: string, newName: string]
  delete: [folderId: string]
}>()

const { t } = useI18n()
const showMenu = ref(false)
const showRenameModal = ref(false)
const showDeleteConfirm = ref(false)
const newName = ref('')

const menuRef = ref<HTMLElement | null>(null)

const handleRename = () => {
  if (newName.value.trim()) {
    emit('rename', props.folder.id, newName.value.trim())
    showRenameModal.value = false
    newName.value = ''
  }
}

const handleDelete = () => {
  emit('delete', props.folder.id)
  showDeleteConfirm.value = false
}

const openRename = () => {
  newName.value = props.folder.name
  showRenameModal.value = true
  showMenu.value = false
}

// Close menu on outside click
const handleClickOutside = (e: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative inline-block" ref="menuRef">
    <button
      class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-stone-700 text-gray-400 hover:text-gray-600 dark:hover:text-stone-300 transition-colors"
      @click.stop="showMenu = !showMenu"
      :aria-label="`Manage folder ${folder.name}`"
      :aria-expanded="showMenu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="showMenu"
      class="absolute right-0 mt-1 w-36 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-gray-200 dark:border-stone-700 py-1 z-10"
      role="menu"
    >
      <button
        class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 flex items-center gap-2"
        role="menuitem"
        @click="openRename"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
        {{ t('favorites.renameFolder') }}
      </button>
      <button
        class="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
        role="menuitem"
        @click="showDeleteConfirm = true; showMenu = false"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        {{ t('favorites.deleteFolder') }}
      </button>
    </div>

    <!-- Rename Modal -->
    <Teleport to="body">
      <div
        v-if="showRenameModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showRenameModal = false"
      >
        <div
          class="bg-white dark:bg-stone-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="'rename-folder-modal-title'"
        >
          <h3 id="rename-folder-modal-title" class="text-lg font-bold text-gray-900 dark:text-stone-100 mb-4">
            {{ t('favorites.renameFolder') }}
          </h3>

          <div>
            <label for="rename-input" class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
              {{ t('favorites.folderName') }}
            </label>
            <input
              id="rename-input"
              v-model="newName"
              type="text"
              maxlength="100"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              @keyup.enter="handleRename"
            />
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              @click="showRenameModal = false"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              :disabled="!newName.trim()"
              @click="handleRename"
            >
              {{ t('favorites.renameFolder') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDeleteConfirm = false"
      >
        <div
          class="bg-white dark:bg-stone-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="'delete-folder-modal-title'"
          :aria-describedby="'delete-folder-modal-desc'"
        >
          <h3 id="delete-folder-modal-title" class="text-lg font-bold text-gray-900 dark:text-stone-100 mb-2">
            {{ t('favorites.deleteFolder') }}
          </h3>
          <p id="delete-folder-modal-desc" class="text-gray-600 dark:text-stone-400 mb-6">
            {{ t('favorites.deleteFolderConfirm') }}
          </p>

          <div class="flex justify-end gap-2">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              @click="handleDelete"
            >
              {{ t('favorites.deleteFolder') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
