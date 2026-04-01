<script setup lang="ts">
/**
 * FolderModal - 文件夹创建/重命名弹窗组件
 *
 * 功能：
 * - 支持创建和重命名两种模式
 * - 文件夹名称输入
 * - 颜色选择（仅创建模式）
 *
 * 使用方式：
 * <FolderModal
 *   mode="create" | "rename"
 *   :visible="showModal"
 *   :folder-name="initialName"
 *   :folder-color="initialColor"
 *   @close="onClose"
 *   @confirm="onConfirm"
 * />
 */
import type { FavoriteFolder } from '~/composables/useFavorites'

interface Props {
  visible: boolean
  mode: 'create' | 'rename'
  folderName?: string
  folderColor?: string
  folder?: FavoriteFolder | null
}

const props = withDefaults(defineProps<Props>(), {
  folderName: '',
  folderColor: '#F97316',
  folder: null,
})

const emit = defineEmits<{
  close: []
  confirm: [name: string, color?: string]
}>()

const { t } = useI18n()

const localName = ref(props.folderName)
const localColor = ref(props.folderColor)

// Sync with props when modal opens
watch(() => props.visible, (visible) => {
  if (visible) {
    localName.value = props.folderName
    localColor.value = props.folderColor
  }
})

// Sync folder prop changes
watch(() => props.folder, (folder) => {
  if (folder) {
    localName.value = folder.name
    localColor.value = folder.color
  }
}, { immediate: true })

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

const handleConfirm = () => {
  if (localName.value.trim()) {
    if (props.mode === 'create') {
      emit('confirm', localName.value.trim(), localColor.value)
    } else {
      emit('confirm', localName.value.trim())
    }
  }
}

const modalTitle = computed(() => {
  return props.mode === 'create'
    ? t('favorites.createFolder')
    : t('favorites.renameFolder')
})

const confirmText = computed(() => {
  return props.mode === 'create'
    ? t('favorites.createFolder')
    : t('favorites.renameFolder')
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="emit('close')"
      >
        <div
          class="bg-white dark:bg-stone-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
          role="dialog"
          aria-modal="true"
        >
          <h3 class="text-lg font-bold text-gray-900 dark:text-stone-100 mb-4">
            {{ modalTitle }}
          </h3>

          <div class="space-y-4">
            <!-- Folder Name Input -->
            <div>
              <label for="folder-name" class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1">
                {{ t('favorites.folderName') }}
              </label>
              <input
                id="folder-name"
                v-model="localName"
                type="text"
                maxlength="100"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                :placeholder="t('favorites.folderNamePlaceholder')"
                @keyup.enter="handleConfirm"
              />
            </div>

            <!-- Color Picker (only in create mode) -->
            <div v-if="mode === 'create'">
              <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-2">
                Color
              </label>
              <div class="flex gap-2">
                <button
                  v-for="color in folderColors"
                  :key="color"
                  class="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  :class="localColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''"
                  :style="{ backgroundColor: color }"
                  @click="localColor = color"
                  :aria-label="`Select color ${color}`"
                />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 mt-6">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              :disabled="!localName.trim()"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
