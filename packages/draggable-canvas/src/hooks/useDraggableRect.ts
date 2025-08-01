import type { Ref } from 'vue'
import type { Rect } from '../types'
import { computed, inject, ref } from 'vue'
import { CanvasItemType } from '../enum'
import { getUnitByType } from '../utils'
import usePageSize from './usePageSize'

export interface UseDraggableRectOptions {
  id: string
  rect: Ref<Rect>
  emitUpdate: (rect: any) => void
  emitDropItem: (id: string, item: any) => void
  unit?: 'px'
}

type ResizeType =
  | 'right-bottom' | 'right-top' | 'left-bottom' | 'left-top'
  | 'top' | 'bottom' | 'left' | 'right'

export function useDraggableRect(options: UseDraggableRectOptions) {
  const { rootFontSize } = usePageSize()
  const production = inject<Ref<boolean>>('draggableCanvasProduction')!
  const rect = options.rect
  const dragging = ref(false)
  const resizing = ref(false)
  const resizeType = ref<ResizeType | null>(null)
  const offset = ref({ x: 0, y: 0 })
  
  const position = computed(() => ({
    x: rect.value.x,
    y: rect.value.y,
  }))

  const size = computed(() => ({
    width: rect.value.width,
    height: rect.value.height,
  }))

  // 计算样式对象的函数
  const createRectStyle = () => {
    // 计算位置样式
    const getPositionStyle = () => ({
      left: `${position.value.x}${getUnitByType(rect.value, 'left', production.value)}`,
      top: `${position.value.y}${getUnitByType(rect.value, 'top', production.value)}`,
    })

    // 计算尺寸样式
    const getSizeStyle = () => ({
      width: size.value.width === -100 ? 'auto' : `${size.value.width}${getUnitByType(rect.value, 'width', production.value)}`,
      height: size.value.height === -100 ? 'auto' : `${size.value.height}${getUnitByType(rect.value, 'height', production.value)}`,
    })

    // 计算边框样式
    const getBorderStyle = () => ({
      border: dragging.value || rect.value.type === CanvasItemType.Default ? '2px dashed #1890ff' : '2px solid #1890ff',
      borderRadius: '4px',
    })

    return {
      rootFontSize: `${rootFontSize.value}px`,
      position: 'absolute' as const,
      boxSizing: 'border-box' as const,
      transition: 'border 0.1s',
      ...getPositionStyle(),
      ...getSizeStyle(),
      ...getBorderStyle(),
      // background: production.value ? 'transparent' : '#fff',
      // transform: `scale(${rect.value.scale})`,
      // transformOrigin: 'top left',
    }
  }

  // 使用computed替代watchEffect，更高效且响应式
  const rectStyle = computed(createRectStyle)

  function onMouseDown(e: MouseEvent) {
    if (isInputElement(e.target))
      return
    dragging.value = true
    offset.value = {
      x: e.clientX - position.value.x,
      y: e.clientY - position.value.y,
    }
    if (isInputElement(e.target))
      return
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', onMouseUp)
  }

  function onDrag(e: MouseEvent) {
    if (!dragging.value)
      return
    const newX = e.clientX - offset.value.x
    const newY = e.clientY - offset.value.y
    options.emitUpdate({
      ...rect.value,
      x: newX,
      y: newY,
    })
  }

  function onMouseUp() {
    dragging.value = false
    if (resizing.value) {
      resizing.value = false
      resizeType.value = null
      document.removeEventListener('mousemove', onResize)
      document.removeEventListener('mouseup', onMouseUp)
    }
    else {
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }

  // 多方向缩放
  function onResizeStart(type: ResizeType, e: MouseEvent) {
    e.stopPropagation()
    resizing.value = true
    resizeType.value = type
    offset.value = {
      x: e.clientX,
      y: e.clientY,
    }
    document.addEventListener('mousemove', onResize)
    document.addEventListener('mouseup', onMouseUp)
  }

  function onResize(e: MouseEvent) {
    if (!resizing.value || !resizeType.value)
      return
    const minW = 40
    const minH = 40
    const dx = e.clientX - offset.value.x
    const dy = e.clientY - offset.value.y
    let { x, y } = position.value
    let { width, height } = size.value
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
      ...rect.value,
      x,
      y,
      width,
      height,
    })
  }

  function onDrop(e: DragEvent) {
    // 支持 type 拖拽，矩形只做接收，type 直接覆盖
    const type = Number(e.dataTransfer?.getData('type'))
    options.emitUpdate({
      ...rect.value,
      type,
    })
  }

  function onItemDrag(_item: any, _e: DragEvent) {
    // 可扩展：支持矩形内元素拖动
  }
  function onItemDrop(_item: any, _e: DragEvent) {
    // 可扩展：支持矩形内元素拖动
  }

  // 判断是输入框
  function isInputElement(el: EventTarget | null): boolean {
    if (!(el instanceof HTMLElement))
      return false
    if (
      el.tagName === 'INPUT'
      || el.tagName === 'TEXTAREA'
      || el.isContentEditable
    ) {
      return true
    }
    // 可递归查找父节点
    if (el.parentElement)
      return isInputElement(el.parentElement)
    return false
  }

  return {
    dragging,
    resizing,
    size,
    position,
    rectStyle,
    onMouseDown,
    onResizeStart,
    onDrop,
    onItemDrag,
    onItemDrop,
  }
}
