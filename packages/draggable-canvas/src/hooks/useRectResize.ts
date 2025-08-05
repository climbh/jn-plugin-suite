import type { Ref } from 'vue'
import type { Rect } from '../types'
import { ref } from 'vue'

export type ResizeType =
  | 'right-bottom' | 'right-top' | 'left-bottom' | 'left-top'
  | 'top' | 'bottom' | 'left' | 'right'

export interface UseRectResizeOptions {
  rect: Ref<Rect>
  emitUpdate: (rect: any) => void
}

export function useRectResize(options: UseRectResizeOptions) {
  const resizing = ref(false)
  const resizeType = ref<ResizeType | null>(null)
  const offset = ref({ x: 0, y: 0 })

  // 多方向缩放开始
  function onResizeStart(type: ResizeType, e: MouseEvent) {
    e.stopPropagation()
    resizing.value = true
    resizeType.value = type
    offset.value = {
      x: e.clientX,
      y: e.clientY,
    }
    document.addEventListener('mousemove', onResize)
    document.addEventListener('mouseup', onResizeEnd)
  }

  // 多方向缩放处理
  function onResize(e: MouseEvent) {
    if (!resizing.value || !resizeType.value)
      return
    
    const minW = 40
    const minH = 40
    const dx = e.clientX - offset.value.x
    const dy = e.clientY - offset.value.y
    let { x, y } = { x: options.rect.value.x, y: options.rect.value.y }
    let { width, height } = { width: options.rect.value.width, height: options.rect.value.height }

    switch (resizeType.value) {
      case 'right-bottom':
        width = Math.max(minW, width + dx)
        height = Math.max(minH, height + dy)
        break
      case 'right-top':
        width = Math.max(minW, width + dx)
        if (height - dy >= minH) {
          y += dy
          height = height - dy
        }
        break
      case 'left-bottom':
        if (width - dx >= minW) {
          x += dx
          width = width - dx
        }
        height = Math.max(minH, height + dy)
        break
      case 'left-top':
        if (width - dx >= minW) {
          x += dx
          width = width - dx
        }
        if (height - dy >= minH) {
          y += dy
          height = height - dy
        }
        break
      case 'top':
        if (height - dy >= minH) {
          y += dy
          height = height - dy
        }
        break
      case 'bottom':
        height = Math.max(minH, height + dy)
        break
      case 'left':
        if (width - dx >= minW) {
          x += dx
          width = width - dx
        }
        break
      case 'right':
        width = Math.max(minW, width + dx)
        break
    }

    offset.value = { x: e.clientX, y: e.clientY }
    
    options.emitUpdate({
      ...options.rect.value,
      x,
      y,
      width,
      height,
    })
  }

  // 缩放结束
  function onResizeEnd() {
    resizing.value = false
    resizeType.value = null
    document.removeEventListener('mousemove', onResize)
    document.removeEventListener('mouseup', onResizeEnd)
  }

  return {
    resizing,
    resizeType,
    onResizeStart,
    onResizeEnd,
  }
} 