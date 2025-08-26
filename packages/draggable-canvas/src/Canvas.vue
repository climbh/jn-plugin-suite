<script lang="ts" setup>
import type { Component } from 'vue'
import type { Rect } from './types'
import { computed, defineEmits, defineProps, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
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
import { useKeyboard } from './hooks/useKeyboard'
import { transformRectsToSize } from './utils'
import { getRootSize } from './utils/window'

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

const canvasDom = ref<HTMLElement | null>(null)

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

// 右键菜单 hook
const { contextMenuState, onCanvasContextMenu, handleMenuAction } = useCanvasContextMenu({
  canvasDom,
  rects,
  deleteRect,
  fullscreenRect,
  restoreRect,
})

// 键盘事件
useKeyboard({
  rects,
  selectedRectId,
  deleteRect,
})

onMounted(() => {
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)
  window.addEventListener('fullscreenchange', updateCanvasSize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateCanvasSize)
  window.removeEventListener('fullscreenchange', updateCanvasSize)
})

// 矩形双击事件
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

// 画布点击事件
function onCanvasClick(e: MouseEvent) {
  // 只有点击画布空白处才取消选中
  if (e.target === canvasDom.value) {
    selectedRectId.value = null
  }
}

// 矩形绘制完成事件
function onDrawComplete(rectData: { x: number, y: number, width: number, height: number }) {
  const rect: Rect = {
    id: String(Date.now()),
    x: rectData.x,
    y: rectData.y,
    width: rectData.width,
    height: rectData.height,
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

const { previewRect, onMouseDown, bindCanvasRef } = useDrawRect(50, 50, {
  production,
  onDrawComplete,
})

// 初始化矩形
watch(
  () => props.initialRects,
  () => {
    rects.value = props.initialRects
    updateCanvasSize()
  },
  { immediate: true },
)

// 绑定画布 ref
watch(
  canvasDom,
  (el) => {
    bindCanvasRef(el)
  },
)

// 更新矩形内容
function updateRectContent(id: string, content: string) {
  const idx = rects.value.findIndex(r => r.id === id)
  if (idx !== -1)
    rects.value[idx].content = content
}

// 更新登录框大小
function updateLoginSizeHandle(id: string, { width, height }: { width: number, height: number }) {
  const idx = rects.value.findIndex(r => r.id === id)
  if (idx !== -1) {
    rects.value[idx].width = width
    rects.value[idx].height = height
  }
}

// 拖拽项事件
function handleDropItem(id: string, item: any) {
  emit('dropItem', id, item)
}

// 更新矩形
watch(
  rects,
  (val) => {
    if (props.mode !== 'create') {
      return
    }
    emit('update:rects', val)
  },
  { deep: true },
)

// 新增 addRect/updateRect 事件输出
function emitAddRect(rect: Rect) {
  emit('addRect', rect)
}

const renderRects = computed(() => {
  return rects.value
})

// 更新画布尺寸
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
</script>

<template>
  <div
    ref="canvasDom"
    class="canvas"
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
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  background: transparent;
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
