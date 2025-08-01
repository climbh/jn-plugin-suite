<script lang="ts" setup>
import type { Component } from 'vue'
import type { Rect } from './types'
import html2canvas from 'html2canvas'
import { computed, defineEmits, defineProps, nextTick, onBeforeUnmount, onMounted, provide, ref, watch, watchEffect } from 'vue'
import Background from './components/background/index.vue'
import ContextMenu from './components/ContextMenu.vue'
import Login from './components/login/index.vue'
import Text from './components/text/index.vue'
import DraggableRect from './DraggableRect.vue'
import EdgePopup from './EdgePopup.vue'
import { CanvasItemType } from './enum'
import { useCanvasContextMenu } from './hooks/useCanvasContextMenu'
import { useCanvasRects } from './hooks/useCanvasRects'
import { useDrawRect } from './hooks/useDrawRect'
import { transformRectsToSize } from './utils'
import { getRootSize } from './utils/window'
import { useEventListener } from './hooks/useEventListener'

defineOptions({
  name: 'DraggableCanvas',
})

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  initialRects: () => [],
  transformContent: undefined,
})

const emit = defineEmits(['update:rects', 'addRect', 'updateRect', 'dropItem', 'selectRect'])

interface Props {
  transformContent: (type: CanvasItemType, data: any) => Promise<any> | undefined
  initialRects?: Rect[]
  mode?: 'create' | 'review' | 'production'
}

provide('transformContent', props.transformContent)

const components = {
  [CanvasItemType.Background]: Background,
  [CanvasItemType.Text]: Text,
  [CanvasItemType.Login]: Login,
} as Record<any, Component>

const production = computed(() => ['production', 'review'].includes(props.mode))
const canvasSize = ref<{ width: number, height: number }>({ width: 0, height: 0 })
provide('draggableCanvasParentSize', canvasSize)
provide('draggableCanvasMode', props.mode)
provide('draggableCanvasProduction', production)

const {
  rects,
  selectedRectId,
  updateRect,
  deleteRect,
  fullscreenRect,
  restoreRect,
} = useCanvasRects({
  initialRects: props.initialRects,
  canvasSize,
  production,
})

const canvasStyle = computed(() => ({
  position: 'relative' as const,
  // width: `${canvasSize.value.width || 0}px`,
  // height: `${canvasSize.value.height || 0}px`,
  background: 'transparent',
  // border: '1px solid #e5e7eb',
  // marginBottom: '16px',
}))

// 右键菜单 hook
const { contextMenuState, openContextMenu, closeContextMenu } = useCanvasContextMenu()
const canvasDom = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

// 记录全屏前的矩形信息
function isRectFullscreen(rect: Rect): boolean {
  return rect.x === 0 && rect.y === 0 && rect.width === 100 && rect.height === 100
}

function handleMenuAction(action: string) {
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
      deleteRect(id)
      break
    case 'fullscreen':
      if (!contextMenuState.value.fullscreen) {
        if (rects.value.some(r => r._prevRect) && !isRectFullscreen(rects.value.find(r => r.id === id)!)) {
          closeContextMenu()
          return
        }
        handleMenuAction('bottom')
        fullscreenRect(id)
      }
      else {
        restoreRect(id)
      }
      break
    case 'cancel':
      closeContextMenu()
      break
  }
  closeContextMenu()
}

// 键盘删除
function onKeydown(e: KeyboardEvent) {
  // 有聚焦元素，则不进行删除
  if(isFocusEvent.value) return
  if (['Delete', 'Backspace'].includes(e.key) && selectedRectId.value) {
    const idx = rects.value.findIndex(r => r.id === selectedRectId.value)
    if (idx !== -1) {
      rects.value.splice(idx, 1)
      selectedRectId.value = null
    }
  }
}

const { isFocusEvent } = useEventListener()


onMounted(() => {
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)
  window.addEventListener('fullscreenchange', updateCanvasSize)
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateCanvasSize)
  window.removeEventListener('fullscreenchange', updateCanvasSize)
  window.removeEventListener('keydown', onKeydown)
})

function onRectClick(id: string) {
  const rect = rects.value.find(r => r.id === id)
  if (rect && !rect._prevRect) {
    selectedRectId.value = id
    emit('selectRect', {
      ...rect,
      id,
    })
  }
}

function onCanvasClick(e: MouseEvent) {
  // 只有点击画布空白处才取消选中
  if (e.target === canvasDom.value) {
    selectedRectId.value = null
  }
}

// ====== 拖拽绘制矩形相关逻辑 ======
const { isDrawing, previewRect, onMouseDown, bindCanvasRef } = useDrawRect(50, 50, {
  production,
})

watch(() => props.initialRects, () => {
  rects.value = props.initialRects
  updateCanvasSize()
}, { immediate: true })

watch(canvasDom, (el) => {
  bindCanvasRef(el)
})

let lastPreviewRect: { x: number, y: number, width: number, height: number } | null = null

watch(previewRect, (val) => {
  if (val)
    lastPreviewRect = { ...val }
})

watch(isDrawing, (drawing, prev) => {
  if (prev && !drawing && lastPreviewRect) {
    const { x, y, width, height } = lastPreviewRect
    if (width >= 50 && height >= 50) {
      const rect: Rect = {
        id: String(Date.now()),
        x,
        y,
        width,
        height,
        type: CanvasItemType.Default,
        originalPageSize: {
          width: canvasSize.value.width,
          height: canvasSize.value.height,
          rootSize: getRootSize(),
        },
      }
      rects.value.push(rect)
      emitAddRect(rect)
    }
    lastPreviewRect = null
  }
})

function updateRectContent(id: string, content: string) {
  const idx = rects.value.findIndex(r => r.id === id)
  if (idx !== -1)
    rects.value[idx].content = content
}

function updateLoginSizeHandle(id: string, { width, height }: { width: number, height: number }) {
  const idx = rects.value.findIndex(r => r.id === id)
  if (idx !== -1) {
    rects.value[idx].width = width
    rects.value[idx].height = height
  }
}

function handleDropItem(id: string, item: any) {
  emit('dropItem', id, item)
}

watch(rects, (val) => {
  if (props.mode !== 'create')
    return
  emit('update:rects', val)
}, { deep: true })

// 监听画布尺寸变化，自适应模式下重算渲染
watch(canvasSize, () => {

})

// 新增 addRect/updateRect 事件输出
function emitAddRect(rect: Rect) {
  emit('addRect', rect)
}

// 渲染时转换为 px
const renderRects = computed(() => {
  return rects.value
})

function updateCanvasSize() {
  if (canvasDom.value) {
    nextTick(() => {
      canvasSize.value = {
        width: canvasDom.value!.clientWidth,
        height: canvasDom.value!.clientHeight,
      }
      // 获取完容器尺寸后转换
      rects.value = transformRectsToSize(rects.value, {
        width: canvasSize.value.width,
        height: canvasSize.value.height,
      }, production.value)
      
    })
  }
}

function onCanvasContextMenu(e: MouseEvent) {
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
  // 空白处右键（可选）
  // openContextMenu(x, y, null)
}

function exportCanvas() {
  return new Promise((resolve) => {
    html2canvas(canvasDom.value!, {
      width: canvasSize.value.width,
      height: canvasSize.value.height,
      windowWidth: canvasSize.value.width,
      windowHeight: canvasSize.value.height,
    }).then((canvas: any) => {
      resolve(canvas)
    })
  })
}

defineExpose({
  exportCanvas,
})
</script>

<template>
  <div
    ref="canvasDom"
    class="canvas"
    :style="canvasStyle"
    @mousedown.self="onMouseDown"
    @contextmenu.prevent="onCanvasContextMenu"
    @click="onCanvasClick"
  >
    <DraggableRect
      v-for="rect in renderRects"
      :key="rect.id"
      :rect="rect"
      :class="{ selected: rect.id === selectedRectId }"
      @update="updateRect"
      @drop-item="handleDropItem"
      @dblclick="!production && onRectClick(rect.id)"
    >
      <component :is="components[rect.type]" :rect="rect" @update="updateRectContent" @update-login-size="updateLoginSizeHandle">
        <template v-if="rect.type === CanvasItemType.Login">
          <slot :rect="rect" />
        </template>
      </component>
    </DraggableRect>
    <!-- 预览矩形 -->
    <div
      v-if="previewRect"
      class="preview-rect"
      :style="{
        left: `${previewRect.x}px`,
        top: `${previewRect.y}px`,
        width: `${previewRect.width}px`,
        height: `${previewRect.height}px`,
      }"
    />
    <EdgePopup v-if="!production" />
    <!-- 右键菜单 -->
    <ContextMenu
      :visible="contextMenuState.visible"
      :x="contextMenuState.x"
      :y="contextMenuState.y"
      :rects="rects"
      :rect="contextMenuState.rect"
      :fullscreen="contextMenuState.fullscreen"
      @action="handleMenuAction"
    />
  </div>
</template>

<style scoped>
.canvas {
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}
.material-bar {
  margin-top: 8px;
}
.canvas-item {
  position: absolute;
  padding: 2px 8px;
  border: 1px solid #ffe58f;
  border-radius: 2px;
  background: #fffbe6;
  cursor: move;
  user-select: none;
}
.preview-rect {
  position: absolute;
  z-index: 10;
  border: 2px dashed #1890ff;
  background: rgba(24, 144, 255, 0.08);
  pointer-events: none;
}
.context-menu {
  position: absolute;
  z-index: 9999;
  min-width: 140px;
  margin: 0;
  padding: 6px 0;
  list-style: none;
  color: #222222;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 4px 16px #0002;
  font-size: 15px;
  animation: fadeIn 0.15s;
}
.context-menu li {
  display: flex;
  align-items: center;
  padding: 8px 20px 8px 18px;
  border: none;
  background: none;
  cursor: pointer;
  user-select: none;
  transition: background 0.18s, color 0.18s;

  gap: 8px;
}
.context-menu li:hover {
  color: #1890ff;
  background: #e6f7ff;
}
.context-menu li.danger {
  color: #e74c3c;
}
.context-menu li.danger:hover {
  color: #cf1322;
  background: #fff1f0;
}
.context-menu .icon {
  width: 1.2em;
  text-align: center;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.selected {
  /* z-index: 2;  // 移除层级提升，只做高亮 */
  outline: 1.5px solid #1890ff;
}
</style>

<style lang="scss">
.canvas {
  * {
    user-select: none;
  }
}
</style>
