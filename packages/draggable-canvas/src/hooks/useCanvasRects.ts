import type { Ref } from 'vue'
import type { Rect } from '../types'
import { ref } from 'vue'

export function useCanvasRects(props: {
  initialRects?: Rect[]
  canvasSize: Ref<{ width: number, height: number }>
  production: Ref<boolean>
}) {
  const rects = ref<Rect[]>([])
  if (props.initialRects) {
    rects.value = props.initialRects
  }
  const selectedRectId = ref<string | null>(null)

  function addRect(rect: Rect) {
    rects.value.push(rect)
  }
  function updateRect(updated: Rect) {
    const idx = rects.value.findIndex(r => r.id === updated.id)
    if (idx !== -1) {
      rects.value.splice(idx, 1, { ...rects.value[idx], ...updated })
    }
  }
  function deleteRect(id: string) {
    const idx = rects.value.findIndex(r => r.id === id)
    if (idx !== -1)
      rects.value.splice(idx, 1)
  }
  function selectRect(id: string) {
    selectedRectId.value = id
  }
  function clearSelect() {
    selectedRectId.value = null
  }
  function isRectFullscreen(rect: Rect): boolean {
    return rect.x === 0 && rect.y === 0 && rect.width === props.canvasSize.value.width && rect.height === props.canvasSize.value.height
  }
  function fullscreenRect(id: string) {
    const idx = rects.value.findIndex(r => r.id === id)
    if (idx === -1)
      return
    const rect = rects.value[idx]
    if (!isRectFullscreen(rect)) {
      const newRect = {
        ...rect,
        _prevRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      }
      newRect.x = 0
      newRect.y = 0
      newRect.width = props.canvasSize.value.width
      newRect.height = props.canvasSize.value.height
      rects.value.splice(idx, 1, newRect)
    }
  }
  function restoreRect(id: string) {
    const idx = rects.value.findIndex(r => r.id === id)
    if (idx === -1)
      return
    const rect = rects.value[idx]
    if (rect._prevRect) {
      const restored = { ...rect, ...rect._prevRect }
      delete restored._prevRect
      rects.value.splice(idx, 1, restored)
    }
  }
  return {
    rects,
    selectedRectId,
    addRect,
    updateRect,
    deleteRect,
    selectRect,
    clearSelect,
    isRectFullscreen,
    fullscreenRect,
    restoreRect,
  }
}
