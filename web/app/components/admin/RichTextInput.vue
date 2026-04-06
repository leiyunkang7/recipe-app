<script setup lang="ts">
/**
 * RichTextInput - Optimized rich text input component for recipe editor
 *
 * Features:
 * - Formatting toolbar (bold, italic, bullet list, numbered list)
 * - Auto-resizing textarea with dynamic height
 * - Markdown-like syntax for formatting
 * - Keyboard shortcuts (Ctrl+B, Ctrl+I)
 * - Active state detection for formatted text
 * - Improved visual feedback
 */
import { ref, computed, watch, nextTick, onMounted } from 'vue'

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

// Detect if cursor is inside formatted text
const activeFormats = computed(() => {
  const text = props.modelValue
  const pos = textareaRef.value?.selectionStart ?? 0

  // Check for bold (**text**)
  const boldMatch = text.match(/\*\*[^*]+\*\*/)
  const isBold = boldMatch && pos >= text.indexOf(boldMatch[0]) && pos <= text.indexOf(boldMatch[0]) + boldMatch[0].length

  // Check for italic (*text*) - but not bold (**text*)
  const italicRegex = /(?<!\*)\*(?!\*)[^*]+\*(?!\*)/g
  let isItalic = false
  let match
  while ((match = italicRegex.exec(text)) !== null) {
    if (pos >= match.index && pos <= match.index + match[0].length) {
      isItalic = true
      break
    }
  }

  return { bold: isBold, italic: isItalic }
})

const lineHeight = 24

const adjustHeight = () => {
  const textarea = textareaRef.value
  if (!textarea) return

  textarea.style.height = 'auto'
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
        newText = `${text.substring(0, start)}**${selectedText}**${text.substring(end)}`
        cursorOffset = start + 2 + selectedText.length + 2
      } else {
        newText = `${text.substring(0, start)}****${text.substring(end)}`
        cursorOffset = start + 2
      }
      break
    case 'italic':
      if (selectedText) {
        newText = `${text.substring(0, start)}*${selectedText}*${text.substring(end)}`
        cursorOffset = start + 1 + selectedText.length + 1
      } else {
        newText = `${text.substring(0, start)}**${text.substring(end)}`
        cursorOffset = start + 1
      }
      break
    case 'bullet':
      const bulletText = selectedText
        ? selectedText.split('\n').map(line => `- ${line}`).join('\n')
        : '- '
      newText = `${text.substring(0, start)}${bulletText}${text.substring(end)}`
      cursorOffset = start + bulletText.length
      break
    case 'numbered':
      const numberedText = selectedText
        ? selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
        : '1. '
      newText = `${text.substring(0, start)}${numberedText}${text.substring(end)}`
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
    switch (event.key.toLowerCase()) {
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

  // Handle Tab for indentation
  if (event.key === 'Tab') {
    event.preventDefault()
    const textarea = textareaRef.value
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = props.modelValue

    if (event.shiftKey) {
      // Remove indent (2 spaces) at start of line
      const lineStart = text.lastIndexOf('\n', start - 1) + 1
      if (text.substring(lineStart, lineStart + 2) === '  ') {
        const newText = `${text.substring(0, lineStart)}${text.substring(lineStart + 2)}`
        emit('update:modelValue', newText)
        nextTick(() => {
          textarea.setSelectionRange(start - 2, end - 2)
        })
      }
    } else {
      // Insert 2 spaces
      const newText = `${text.substring(0, start)}  ${text.substring(end)}`
      emit('update:modelValue', newText)
      nextTick(() => {
        textarea.setSelectionRange(start + 2, start + 2)
      })
    }
  }
}

const handleSelect = () => {
  // Force reactivity update for active formats when selection changes
  // eslint-disable-next-line no-unused-expressions
  activeFormats.value
}
</script>

<template>
  <div class="rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent transition-all">
    <!-- Toolbar -->
    <div class="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
      <button
        type="button"
        @click="insertFormatting('bold')"
        :class="[
          'p-1.5 rounded transition-colors',
          activeFormats.bold
            ? 'bg-orange-100 text-orange-700'
            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
        ]"
        title="Bold (Ctrl+B)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </button>
      <button
        type="button"
        @click="insertFormatting('italic')"
        :class="[
          'p-1.5 rounded transition-colors',
          activeFormats.italic
            ? 'bg-orange-100 text-orange-700'
            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
        ]"
        title="Italic (Ctrl+I)"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4v2h2.21l-3.42 12H6v2h8v-2h-2.21l3.42-12H18V4z"/>
        </svg>
      </button>
      <div class="w-px h-5 bg-gray-300 mx-1" />
      <button
        type="button"
        @click="insertFormatting('bullet')"
        class="p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
        title="Bullet List"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16" />
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 18h16" />
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </button>
      <button
        type="button"
        @click="insertFormatting('numbered')"
        class="p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
        title="Numbered List"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <text x="2" y="8" font-size="7" font-weight="600">1</text>
          <text x="2" y="14" font-size="7" font-weight="600">2</text>
          <text x="2" y="20" font-size="7" font-weight="600">3</text>
          <path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M8 6h13M8 12h13M8 18h13" fill="none" />
        </svg>
      </button>
    </div>

    <!-- Textarea -->
    <textarea
      ref="textareaRef"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value); adjustHeight()"
      @keydown="handleKeydown"
      @select="handleSelect"
      @click="handleSelect"
      :placeholder="placeholder"
      rows="2"
      class="w-full px-3 py-2 outline-none text-sm sm:text-base resize-none bg-white"
      :style="{ minHeight: `${minRows * lineHeight}px` }"
    />
  </div>
</template>
