<script setup lang="ts">
import type { FavoriteFolder } from '~/composables/useFavorites'

defineProps<{
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

const handleCreate = (name: string, color: string) => {
  emit('create', name, color)
}

const handleRename = (name: string) => {
  if (editingFolder.value) {
    emit('rename', editingFolder.value.id, name)
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
    <FolderModal
      mode="create"
      :visible="showCreateModal"
      @close="showCreateModal = false"
      @confirm="(name, color) => { handleCreate(name, color!); showCreateModal = false }"
    />

    <!-- Rename Modal -->
    <FolderModal
      mode="rename"
      :visible="showRenameModal"
      :folder="editingFolder"
      :folder-name="editingFolder?.name ?? ''"
      @close="showRenameModal = false; editingFolder = null"
      @confirm="(name) => { handleRename(name); showRenameModal = false; editingFolder = null }"
    />

    <!-- Delete Confirmation -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
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
      </Transition>
    </Teleport>
  </div>
</template>
