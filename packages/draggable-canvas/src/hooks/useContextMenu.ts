import type { Rect } from '../types'
import { ref } from 'vue'

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  targetId: string | null
  fullscreen: boolean
}

export function useContextMenu() {
  const state = ref<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
    fullscreen: false,
  })

  function openContextMenu(x: number, y: number, id: string, rect: Rect) {
    state.value.visible = true
    state.value.x = x
    state.value.y = y
    state.value.targetId = id
    state.value.fullscreen = !!rect._prevRect
  }

  function closeContextMenu() {
    state.value.visible = false
    state.value.targetId = null
  }

  return {
    contextMenuState: state,
    openContextMenu,
    closeContextMenu,
  }
}
