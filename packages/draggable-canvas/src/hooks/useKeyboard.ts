import { onMounted, onUnmounted, Ref } from "vue"
import { useEventListener } from "./useEventListener"
import { Rect } from "../types"

const { isFocusEvent } = useEventListener()

export function useKeyboard(props: {
  rects: Ref<Rect[]>,
  selectedRectId: Ref<string | null>,
  deleteRect: (id: string) => void,
}) {
  // 键盘删除
    function onKeydown(e: KeyboardEvent) {
    // 有聚焦元素，则不进行删除
    if (isFocusEvent.value)
      return
    if (['Delete', 'Backspace'].includes(e.key) && props.selectedRectId.value) {
      const idx = props.rects.value.findIndex(r => r.id === props.selectedRectId.value)
      if (idx !== -1) {
        props.rects.value.splice(idx, 1)
        props.selectedRectId.value = null
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
  })
}