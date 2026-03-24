/**
 * Composable for detecting clicks outside a target element.
 * Automatically cleans up event listeners on unmount.
 */
export function useClickOutside(
  targetRef: Ref<HTMLElement | null>,
  callback: (event: MouseEvent) => void,
  options: { capture?: boolean } = {}
) {
  const { capture = false } = options

  const handler = (event: MouseEvent) => {
    if (targetRef.value && !targetRef.value.contains(event.target as Node)) {
      callback(event)
    }
  }

  onMounted(() => {
    document.addEventListener('click', handler, capture)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handler, capture)
  })
}
