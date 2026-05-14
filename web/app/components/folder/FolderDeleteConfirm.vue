<script setup lang="ts">
/**
 * FolderDeleteConfirm - 删除收藏夹文件夹确认弹窗
 */
import type { FavoriteFolder } from '~/composables/useFavorites'

const props = defineProps<{
  show: boolean
  folder: FavoriteFolder | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  delete: [folderId: string]
}>()

const { t } = useI18n()

const handleDelete = () => {
  if (props.folder) {
    emit('delete', props.folder.id)
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-folder-title"
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
            @click="emit('update:show', false)"
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
</template>
