import { computed, ref, type Ref } from 'vue'

export interface DrawRectResult {
  isDrawing: Ref<boolean>
  previewRect: Ref<{ x: number, y: number, width: number, height: number } | null>
  onMouseDown: (e: MouseEvent) => void
  bindCanvasRef: (el: HTMLElement | null) => void
}

export interface DrawRectOptions {
  production: Ref<boolean>
  onDrawComplete?: (rect: { x: number, y: number, width: number, height: number }) => void
}

/**
 * 用于画布上拖拽绘制矩形的 hook
 * @param minWidth 最小宽度
 * @param minHeight 最小高度
 * @param options 配置选项
 */
export function useDrawRect(minWidth = 50, minHeight = 50, options: DrawRectOptions): DrawRectResult {
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
    if (e.button !== 0 || !canvasRef.value || options.production.value)
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
    
    // 在绘制完成时调用回调
    if (isDrawing.value && options.onDrawComplete) {
      const x = Math.min(startX.value, currentX.value)
      const y = Math.min(startY.value, currentY.value)
      const width = Math.abs(currentX.value - startX.value)
      const height = Math.abs(currentY.value - startY.value)
      
      // 只有满足最小尺寸要求时才调用回调
      if (width >= minWidth && height >= minHeight) {
        options.onDrawComplete({ x, y, width, height })
      }
    }
    
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
