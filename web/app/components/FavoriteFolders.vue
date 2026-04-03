<script setup lang="ts">
/**
 * FavoriteFolders - 收藏文件夹管理组件
 *
 * 功能：
 * - 文件夹标签页切换
 * - 创建/重命名/删除文件夹
 *
 * 子组件：
 * - FolderCreateModal.vue   创建弹窗
 * - FolderRenameModal.vue    重命名弹窗
 * - FolderDeleteConfirm.vue  删除确认弹窗
 */
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

const openRename = (folder: FavoriteFolder) => {
  editingFolder.value = folder
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
        <!-- 操作菜单 -->
        <span
          v-if="selectedFolderId === folder.id"
          class="ml-1 text-xs opacity-75"
          @click.stop="openRename(folder)"
        >
          ✏️
        </span>
        <span
          v-if="selectedFolderId === folder.id"
          class="text-xs opacity-75 hover:opacity-100"
          @click.stop="openDelete(folder)"
        >
          🗑️
        </span>
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

    <!-- Modals -->
    <FolderCreateModal
      :show="showCreateModal"
      @update:show="showCreateModal = $event"
      @create="(name, color) => emit('create', name, color)"
    />

    <FolderRenameModal
      :show="showRenameModal"
      :folder="editingFolder"
      @update:show="showRenameModal = $event"
      @rename="(id, name) => emit('rename', id, name)"
    />

    <FolderDeleteConfirm
      :show="showDeleteConfirm"
      :folder="editingFolder"
      @update:show="showDeleteConfirm = $event"
      @delete="(id) => emit('delete', id)"
    />
  </div>
</template>
