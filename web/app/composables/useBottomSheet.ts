/**
 * useBottomSheet - BottomSheet 状态管理 Composable
 *
 * 提供简洁的 API 来控制 BottomSheet 的显示/隐藏，
 * 支持多个 sheet 并存（通过 key 区分）。
 *
 * @example
 * const { isOpen, open, close, sheetProps } = useBottomSheet('filters')
 *
 * // 在模板中
 * <BottomSheet v-bind="sheetProps" @close="close">
 *   ...
 * </BottomSheet>
 */

interface SheetOptions {
  /** 默认 snap 点索引 */
  defaultSnapIndex?: number
  /** snap 点高度（vh） */
  snapPoints?: number[]
  /** 最大高度 */
  maxHeight?: string
  /** 标题 */
  title?: string
  /** 是否显示 handle */
  showHandle?: boolean
}

const sheets = new Map<string, {
  visible: Ref<boolean>
  options: Ref<SheetOptions>
}>()

export function useBottomSheet(key: string, defaultOptions: SheetOptions = {}) {
  if (!sheets.has(key)) {
    sheets.set(key, {
      visible: ref(false),
      options: ref({ ...defaultOptions }),
    })
  }

  const sheet = sheets.get(key)!

  const open = (options: SheetOptions = {}) => {
    sheet.options.value = { ...defaultOptions, ...options }
    sheet.visible.value = true
  }

  const close = () => {
    sheet.visible.value = false
  }

  const sheetProps = computed(() => ({
    visible: sheet.visible.value,
    ...sheet.options.value,
  }))

  return {
    isOpen: sheet.visible,
    open,
    close,
    sheetProps,
    /** 直接修改 sheet 配置 */
    updateOptions: (opts: Partial<SheetOptions>) => {
      sheet.options.value = { ...sheet.options.value, ...opts }
    },
  }
}
