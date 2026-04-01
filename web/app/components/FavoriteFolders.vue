<script setup lang="ts">
import type { FavoriteFolder } from '~/composables/useFavorites'

const props = defineProps<{
  folders: FavoriteFolder[]
  selectedFolderId: string | null
}>()

const emit = defineEmits<{
  select: [folderId: string | null]
  create: [name: string, color: string]
  rename: [folderId: string, newName: string]
  delete: [folderId: string]
}>()

const { t } = useI18n()
const showCreateModal = ref(false)
const showRenameModal = ref(false)
const showDeleteConfirm = ref(false)
const editingFolder = ref<FavoriteFolder | null>(null)
const newFolderName = ref('')
const newFolderColor = ref('#F97316')

const folderColors = [
  '#F97316', // orange
  '#EF4444', // red
  '#22C55E', // green
  '#3B82F6', // blue
  '#A855F7', // purple
  '#EC4899', // pink
  '#EAB308', // yellow
  '#06B6D4', // cyan
]

const handleCreate = () => {
  if (newFolderName.value.trim()) {
    emit('create', newFolderName.value.trim(), newFolderColor.value)
    newFolderName.value = ''
    newFolderColor.value = '#F97316'
    showCreateModal.value = false
  }
}

const handleRename = () => {
  if (editingFolder.value && newFolderName.value.trim()) {
    emit('rename', editingFolder.value.id, newFolderName.value.trim())
    showRenameModal.value = false
    editingFolder.value = null
    newFolderName.value = ''
  }
}

const handleDelete = () => {
  if (editingFolder.value) {
    emit('delete', editingFolder.value.id)
    showDeleteConfirm.value = false
    editingFolder.value = null
  }
}

const openRename = (folder: FavoriteFolder) => {
  editingFolder.value = folder
  newFolderName.value = folder.name
  showRenameModal.value = true
}

const openDelete = (folder: FavoriteFolder) => {
  editingFolder.value = folder
  showDeleteConfirm.value = true
}
</script>

<template>
  <div class="mb-6">
    <!-- Folder Tabs -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <!-- All Favorites -->
      <button
        class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors"
        :class="selectedFolderId === null
          ? 'bg-orange-500 text-white'
          : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'"
        @click="emit('select', null)"
        :aria-pressed="selectedFolderId === null"
      >
        {{ t('favorites.allFavorites') }}
      </button>

      <!-- Folder buttons -->
      <button
        v-for="folder in folders"
        :key="folder.id"
        class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1"
        :class="selectedFolderId === folder.id
          ? 'text-white'
          : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-600'"
        :style="selectedFolderId === folder.id ? { backgroundColor: folder.color } : {}"
        @click="emit('select', folder.id)"
        :aria-pressed="selectedFolderId === folder.id"
      >
        <span>{{ folder.name }}</span>
      </button>

      <!-- Add Folder Button -->
      <button
        class="flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-stone-700 text-gray-500 dark:text-stone-400 hover:bg-gray-200 dark:hover:bg-stone-600 flex items-center gap-1"
        @click="showCreateModal = true"
        :aria-label="t('favorites.createFolder')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <span>{{ t('favorites.createFolder') }}</span>
      </button>
    </div>

    <!-- Create Folder Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showCreateModal = false"
      >
        <div
          class="bg-white dark:bg-stone-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="'create-folder-title'"
        >
          <h3 id="create-folder-title" class="text-lg font-bold text-gray-900 dark:text-stone-100 mb-4">
            {{ t('favorites.createFolder') }}
          </h3>

          <div class="space-y-4">
            <div>
              <label for="folder-name" class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
                {{ t('favorites.folderName') }}
              </label>
              <input
                id="folder-name"
                v-model="newFolderName"
                type="text"
                maxlength="100"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                @keyup.enter="handleCreate"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
                Color
              </label>
              <div class="flex gap-2">
                <button
                  v-for="color in folderColors"
                  :key="color"
                  class="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  :class="newFolderColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''"
                  :style="{ backgroundColor: color }"
                  @click="newFolderColor = color"
                  :aria-label="`Select color ${color}`"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              @click="showCreateModal = false"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              :disabled="!newFolderName.trim()"
              @click="handleCreate"
            >
              {{ t('favorites.createFolder') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

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
          :aria-labelledby="'rename-folder-title'"
        >
          <h3 id="rename-folder-title" class="text-lg font-bold text-gray-900 dark:text-stone-100 mb-4">
            {{ t('favorites.renameFolder') }}
          </h3>

          <div>
            <label for="rename-folder-name" class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
              {{ t('favorites.folderName') }}
            </label>
            <input
              id="rename-folder-name"
              v-model="newFolderName"
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
              :disabled="!newFolderName.trim()"
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
          :aria-labelledby="'delete-folder-title'"
          :aria-describedby="'delete-folder-desc'"
        >
          <h3 id="delete-folder-title" class="text-lg font-bold text-gray-900 dark:text-stone-100 mb-2">
            {{ t('favorites.deleteFolder') }}
          </h3>
          <p id="delete-folder-desc" class="text-gray-600 dark:text-stone-400 mb-6">
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
