<script setup lang="ts">
/**
 * RichTextInput - Rich text input component for recipe editor
 *
 * Features:
 * - Formatting toolbar (bold, italic, bullet list, numbered list)
 * - Auto-resizing textarea
 * - Markdown-like syntax for formatting
 * - Keyboard shortcuts support
 */
import { ref, watch, nextTick, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  minRows?: number
  maxRows?: number
}>(), {
  placeholder: '',
  minRows: 2,
  maxRows: 20
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const adjustHeight = () => {
  const textarea = textareaRef.value
  if (!textarea) return

  textarea.style.height = 'auto'
  const lineHeight = 24
  const minHeight = props.minRows * lineHeight
  const maxHeight = props.maxRows * lineHeight
  const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
  textarea.style.height = `${newHeight}px`
}

watch(() => props.modelValue, () => {
  nextTick(adjustHeight)
})

onMounted(() => {
  adjustHeight()
})

const insertFormatting = (format: 'bold' | 'italic' | 'bullet' | 'numbered') => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = props.modelValue
  const selectedText = text.substring(start, end)

  let newText = ''
  let cursorOffset = 0

  switch (format) {
    case 'bold':
      if (selectedText) {
        newText = `**${selectedText}**`
        cursorOffset = newText.length
      } else {
        newText = text.substring(0, start) + '****' + text.substring(end)
        cursorOffset = start + 2
      }
      break
    case 'italic':
      if (selectedText) {
        newText = `*${selectedText}*`
        cursorOffset = newText.length
      } else {
        newText = text.substring(0, start) + '**' + text.substring(end)
        cursorOffset = start + 1
      }
      break
    case 'bullet':
      const bulletText = selectedText
        ? selectedText.split('\n').map(line => `- ${line}`).join('\n')
        : '- '
      newText = text.substring(0, start) + bulletText + text.substring(end)
      cursorOffset = start + bulletText.length
      break
    case 'numbered':
      const numberedText = selectedText
        ? selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
        : '1. '
      newText = text.substring(0, start) + numberedText + text.substring(end)
      cursorOffset = start + numberedText.length
      break
  }

  emit('update:modelValue', newText)

  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(cursorOffset, cursorOffset)
    adjustHeight()
  })
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'b':
        event.preventDefault()
        insertFormatting('bold')
        break
      case 'i':
        event.preventDefault()
        insertFormatting('italic')
        break
    }
  }
}
</script>

<template>
  <div class="rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent">
    <!-- Toolbar -->
    <div class="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
      <button
        type="button"
        @click="insertFormatting('bold')"
        class="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
        title="Bold (Ctrl+B)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </button>
      <button
        type="button"
        @click="insertFormatting('italic')"
        class="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
        title="Italic (Ctrl+I)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 4h4m-2 0v16m4 0h-4" transform="skewX(-10)" />
        </svg>
      </button>
      <div class="w-px h-5 bg-gray-300 mx-1" />
      <button
        type="button"
        @click="insertFormatting('bullet')"
        class="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
        title="Bullet List"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <circle cx="2" cy="6" r="1" fill="currentColor" />
          <circle cx="2" cy="12" r="1" fill="currentColor" />
          <circle cx="2" cy="18" r="1" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        @click="insertFormatting('numbered')"
        class="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
        title="Numbered List"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 6h13M7 12h13M7 18h13" />
          <text x="2" y="8" font-size="8" fill="currentColor">1</text>
          <text x="2" y="14" font-size="8" fill="currentColor">2</text>
          <text x="2" y="20" font-size="8" fill="currentColor">3</text>
        </svg>
      </button>
    </div>

    <!-- Textarea -->
    <textarea
      ref="textareaRef"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value); adjustHeight()"
      @keydown="handleKeydown"
      :placeholder="placeholder"
      rows="2"
      class="w-full px-3 py-2 outline-none text-sm sm:text-base resize-none"
      :style="{ minHeight: `${minRows * 24}px` }"
    />
  </div>
</template>
