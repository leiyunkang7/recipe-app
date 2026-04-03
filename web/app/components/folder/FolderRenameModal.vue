<script setup lang="ts">
/**
 * FolderRenameModal - 重命名收藏夹文件夹弹窗
 */
import type { FavoriteFolder } from '~/composables/useFavorites'

const props = defineProps<{
  show: boolean
  folder: FavoriteFolder | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  rename: [folderId: string, newName: string]
}>()

const { t } = useI18n()
const newFolderName = ref('')

watch(() => props.folder, (f) => {
  if (f) newFolderName.value = f.name
}, { immediate: true })

const handleRename = () => {
  if (props.folder && newFolderName.value.trim()) {
    emit('rename', props.folder.id, newFolderName.value.trim())
    emit('update:show', false)
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="emit('update:show', false)"
    >
      <div
        class="bg-white dark:bg-stone-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-folder-title"
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
            @click="emit('update:show', false)"
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
</template>
