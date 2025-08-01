import { onMounted, onUnmounted, ref } from 'vue'

export function useCanvasContextMenu() {
  const contextMenuState = ref({
    visible: false,
    x: 0,
    y: 0,
    targetId: null as string | null,
    fullscreen: false,
    rect: null as any,
  })
  function openContextMenu(x: number, y: number, id: string | null, rect?: any) {
    contextMenuState.value.visible = true
    contextMenuState.value.x = x
    contextMenuState.value.y = y
    contextMenuState.value.targetId = id
    contextMenuState.value.fullscreen = !!rect?._prevRect
    contextMenuState.value.rect = rect
  }
  function closeContextMenu() {
    contextMenuState.value.visible = false
    contextMenuState.value.targetId = null
    contextMenuState.value.rect = null
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeContextMenu()
    }
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
  }
}
