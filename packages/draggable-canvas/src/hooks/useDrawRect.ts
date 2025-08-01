import { computed, ref, type Ref } from 'vue'

export interface DrawRectResult {
  isDrawing: Ref<boolean>
  previewRect: Ref<{ x: number, y: number, width: number, height: number } | null>
  onMouseDown: (e: MouseEvent) => void
  bindCanvasRef: (el: HTMLElement | null) => void
}

/**
 * 用于画布上拖拽绘制矩形的 hook
 * @param minWidth 最小宽度
 * @param minHeight 最小高度
 */
export function useDrawRect(_minWidth = 50, _minHeight = 50, { production }: { production: Ref<boolean> }): DrawRectResult {
  const isDrawing = ref(false)
  const startX = ref(0)
  const startY = ref(0)
  const currentX = ref(0)
  const currentY = ref(0)
  const canvasRef = ref<HTMLElement | null>(null)

  function bindCanvasRef(el: HTMLElement | null) {
    canvasRef.value = el
  }

  function getCanvasOffset(e: MouseEvent) {
    if (!canvasRef.value)
      return { x: 0, y: 0 }
    const rect = canvasRef.value.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  function onMouseDown(e: MouseEvent) {
    if (e.button !== 0 || !canvasRef.value || production.value)
      return
    const { x, y } = getCanvasOffset(e)
    isDrawing.value = true
    startX.value = x
    startY.value = y
    currentX.value = x
    currentY.value = y
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function onMouseMove(e: MouseEvent) {
    if (!canvasRef.value)
      return
    const { x, y } = getCanvasOffset(e)
    currentX.value = x
    currentY.value = y
  }

  function onMouseUp() {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    isDrawing.value = false
  }

  const previewRect = computed(() => {
    if (!isDrawing.value)
      return null
    const x = Math.min(startX.value, currentX.value)
    const y = Math.min(startY.value, currentY.value)
    const width = Math.abs(currentX.value - startX.value)
    const height = Math.abs(currentY.value - startY.value)
    return { x, y, width, height }
  })

  return {
    isDrawing,
    previewRect,
    onMouseDown,
    bindCanvasRef,
  }
}
