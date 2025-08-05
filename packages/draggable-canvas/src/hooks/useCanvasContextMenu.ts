import { computed, onMounted, onUnmounted, Ref, ref } from 'vue'
import { Rect } from '../types'
import { isRectFullscreen } from '../utils/utils'

export function useCanvasContextMenu(props: {
  canvasDom: Ref<HTMLElement | null>,
  rects: Ref<Rect[]>,
  deleteRect: (id: string) => void,
  fullscreenRect: (id: string) => void,
  restoreRect: (id: string) => void,
}) {

  const contextMenuState = ref({
    visible: false,
    x: 0,
    y: 0,
    targetId: null as string | null,
    fullscreen: false,
    rect: null as any,
  })

  /**
   * 打开右键菜单
   * @param x 菜单的 x 坐标
   * @param y 菜单的 y 坐标
   * @param id 目标矩形的 id
   * @param rect 目标矩形
   */
  function openContextMenu(x: number, y: number, id: string | null, rect?: any) {
    contextMenuState.value.visible = true
    contextMenuState.value.x = x
    contextMenuState.value.y = y
    contextMenuState.value.targetId = id
    contextMenuState.value.fullscreen = !!rect?._prevRect
    contextMenuState.value.rect = rect
  }

  /**
   * 关闭右键菜单
   */
  function closeContextMenu() {
    contextMenuState.value.visible = false
    contextMenuState.value.targetId = null
    contextMenuState.value.rect = null
  }

  /**
   * 处理键盘事件
   * @param e 键盘事件
   */
  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeContextMenu()
    }
  }

  /**
   * 处理菜单操作
   * @param action 操作类型
   */
  function handleMenuAction(action: string) {
    const rects = props.rects
    const id = contextMenuState.value.targetId
    if (!id)
      return
    switch (action) {
      case 'up':
        {
          // 如果最后一个矩形是全屏的，则不进行操作
          if (rects.value[0]?._prevRect)
            return
          const idx = rects.value.findIndex(r => r.id === id)
          if (idx !== -1) {
            const rect = rects.value[idx]
            rects.value.splice(idx, 1)
            rects.value.splice(idx - 1, 0, rect)
          }
        }
        break
      case 'down':
        {
          const idx = rects.value.findIndex(r => r.id === id)
          if (idx !== -1 && idx < rects.value.length - 1) {
            const rect = rects.value[idx]
            rects.value.splice(idx, 1)
            rects.value.splice(idx + 1, 0, rect)
          }
        }
        break
      case 'top':
        {
          const idx = rects.value.findIndex(r => r.id === id)
          if (idx !== -1) {
            const rect = rects.value[idx]
            rects.value.splice(idx, 1)
            rects.value.push(rect)
          }
        }
        break
      case 'bottom':
        {
          // 如果最后一个矩形是全屏的，则不进行操作
          if (rects.value[0]?._prevRect)
            return
          const idx = rects.value.findIndex(r => r.id === id)
          if (idx !== -1) {
            const rect = rects.value[idx]
            rects.value.splice(idx, 1)
            rects.value.unshift(rect)
          }
        }
        break
      case 'delete':
        props.deleteRect(id)
        break
      case 'fullscreen':
        if (!contextMenuState.value.fullscreen) {
          if (rects.value.some(r => r._prevRect) && !isRectFullscreen(rects.value.find(r => r.id === id)!)) {
            closeContextMenu()
            return
          }
          handleMenuAction('bottom')
          props.fullscreenRect(id)
        }
        else {
          props.restoreRect(id)
        }
        break
      case 'cancel':
        closeContextMenu()
        break
    }
    closeContextMenu()
  }

  /**
   * 右键菜单的显示逻辑
   */
  function onCanvasContextMenu(e: MouseEvent) {
    const rects = props.rects
    const canvasDom = props.canvasDom
    if (!canvasDom.value)
      return
    const rect = canvasDom.value.getBoundingClientRect()
    const x = e.clientX - rect.left + canvasDom.value.scrollLeft
    const y = e.clientY - rect.top + canvasDom.value.scrollTop
  
    // 逆序遍历，优先顶层（后渲染）矩形
    for (let i = rects.value.length - 1; i >= 0; i--) {
      const r = rects.value[i]
      // 计算矩形的实际像素位置
      const rx = r.x as number
      const ry = r.y as number
      const rw = r.width as number
      const rh = r.height as number
  
      if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
        openContextMenu(x, y, r.id, r)
        return
      }
    }
    const fullscreenRect = rects.value.find(r => r._prevRect)
    if (fullscreenRect) {
      openContextMenu(x, y, fullscreenRect.id, fullscreenRect)
    }
    // 空白处右键（可选）
    // openContextMenu(x, y, null)
  }

  onMounted(() => {
    window.addEventListener('keyup', handleKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keyup', handleKeyUp)
  })

  return {
    contextMenuState,
    openContextMenu,
    closeContextMenu,
    handleMenuAction,
    onCanvasContextMenu
  }
}
