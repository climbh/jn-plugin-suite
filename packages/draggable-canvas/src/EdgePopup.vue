<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CanvasItemType } from './enum'

const draggableComponents = ref([
  {
    id: '1',
    name: '背景',
    type: CanvasItemType.Background,
    icon: 'flowbite:image-solid',
  },
  {
    id: '2',
    name: '文本',
    type: CanvasItemType.Text,
    icon: 'solar:text-square-bold',
  },
  {
    id: '3',
    name: '登录',
    type: CanvasItemType.Login,
    icon: 'ph:lock-key-open-fill',
  },
])

const btnSize = 48
const borderRadius = 16
const offsetMin = 12

const x = ref(window.innerWidth - btnSize - offsetMin)
const y = ref(100)
const dragging = ref(false)
// const justDragged = ref(false)
const start = { x: 0, y: 0, mouseX: 0, mouseY: 0 }
const windowW = ref(window.innerWidth)
const windowH = ref(window.innerHeight)

const edge = ref<'left' | 'right' | 'top' | 'bottom'>('right')

const showContent = ref(false)

const mouseDownPos = { x: 0, y: 0 }
function onMouseDown(e: MouseEvent) {
  dragging.value = true
  start.x = x.value
  start.y = y.value
  start.mouseX = e.clientX
  start.mouseY = e.clientY
  mouseDownPos.x = e.clientX
  mouseDownPos.y = e.clientY
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (!dragging.value)
    return
  const dx = e.clientX - start.mouseX
  const dy = e.clientY - start.mouseY
  x.value = Math.min(Math.max(start.x + dx, 0), windowW.value - btnSize)
  y.value = Math.min(Math.max(start.y + dy, 0), windowH.value - btnSize)
}

function onMouseUp(e: MouseEvent) {
  if (!dragging.value)
    return
  dragging.value = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  const dx = Math.abs(e.clientX - mouseDownPos.x)
  const dy = Math.abs(e.clientY - mouseDownPos.y)
  const isClick = dx < 5 && dy < 5
  // 吸附逻辑
  const left = x.value
  const right = windowW.value - (x.value + btnSize)
  const top = y.value
  const bottom = windowH.value - (y.value + btnSize)
  const min = Math.min(left, right, top, bottom)
  if (min === left) {
    x.value = offsetMin
    edge.value = 'left'
  }
  else if (min === right) {
    x.value = windowW.value - btnSize - offsetMin
    edge.value = 'right'
  }
  else if (min === top) {
    y.value = offsetMin
    edge.value = 'top'
  }
  else if (min === bottom) {
    y.value = windowH.value - btnSize - offsetMin
    edge.value = 'bottom'
  }
  if (isClick) {
    showContent.value = true
  }
}

onMounted(() => {
  window.addEventListener('resize', () => {
    windowW.value = window.innerWidth
    windowH.value = window.innerHeight
    x.value = Math.min(x.value, windowW.value - btnSize)
    y.value = Math.min(y.value, windowH.value - btnSize)
  })
  document.addEventListener('mousedown', onGlobalClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onGlobalClick)
})

const btnStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${x.value}px`,
  top: `${y.value}px`,
  width: `${btnSize}px`,
  height: `${btnSize}px`,
  borderRadius: `${borderRadius}px`,
  background: '#409eff',
  color: '#fff',
  boxShadow: '0 2px 8px #0002',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  cursor: 'pointer',
  userSelect: 'none' as const,
  zIndex: 9999,
  transition: dragging.value ? 'none' : 'left 0.2s, top 0.2s',
}))

// function onBtnClick() {
//   if (dragging.value || justDragged.value)
//     return
//   showContent.value = true
// }
function onGlobalClick() {
  showContent.value = false
}

// 内容弹窗样式和动画
const contentWidth = 260
const contentHeight = 140
const contentStyle = computed(() => {
  let left = 0
  let top = 0
  if (edge.value === 'right') {
    left = x.value + btnSize
    top = y.value
    // 右侧超出修正
    if (left + contentWidth > windowW.value)
      left = windowW.value - contentWidth
    // 上下超出修正
    if (top + contentHeight > windowH.value)
      top = windowH.value - contentHeight
    if (top < 0)
      top = 0
  }
  else if (edge.value === 'left') {
    left = x.value - contentWidth
    top = y.value
    if (left < 0)
      left = 0
    if (top + contentHeight > windowH.value)
      top = windowH.value - contentHeight
    if (top < 0)
      top = 0
  }
  else if (edge.value === 'top') {
    left = x.value
    top = y.value - contentHeight
    if (top < 0)
      top = 0
    if (left + contentWidth > windowW.value)
      left = windowW.value - contentWidth
    if (left < 0)
      left = 0
  }
  else if (edge.value === 'bottom') {
    left = x.value
    top = y.value + btnSize
    if (top + contentHeight > windowH.value)
      top = windowH.value - contentHeight
    if (left + contentWidth > windowW.value)
      left = windowW.value - contentWidth
    if (left < 0)
      left = 0
  }
  return {
    position: 'fixed',
    zIndex: 10000,
    minWidth: `${contentWidth}px`,
    minHeight: `${contentHeight}px`,
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 16px #0002',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    left: `${left - offsetMin}px`,
    top: `${top - offsetMin}px`,
  } as any
})

const contentTransition = computed(() => {
  switch (edge.value) {
    case 'left': return 'slide-left'
    case 'right': return 'slide-right'
    case 'top': return 'slide-up'
    case 'bottom': return 'slide-down'
    default: return 'slide-right'
  }
})

function onDragStart(e: DragEvent, comp: any) {
  e.dataTransfer?.setData('type', comp.type)
}
</script>

<template>
  <div>
    <div
      v-if="!showContent"
      class="edge-popup-btn"
      :style="btnStyle"
      @mousedown="onMouseDown"
    >
      ≡
    </div>
    <transition :name="contentTransition">
      <div
        v-if="showContent"
        class="popup-content"
        :style="contentStyle"
        @mousedown.stop
      >
        <div class="draggable-components">
          <div class="header">
            <Icon icon="iconamoon:options-fill" width="24" height="24" />拖动组件
          </div>
          <div
            v-for="comp in draggableComponents"
            :key="comp.id"
            class="draggable-item"
            draggable="true"
            @dragstart="e => onDragStart(e, comp)"
          >
            <Icon :icon="comp.icon" width="24" height="24" />
            {{ comp.name }}
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.slide-left-enter-active, .slide-left-leave-active {
  transition: transform 0.3s, opacity 0.3s;
}
.slide-left-enter-from, .slide-left-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}
.slide-left-enter-to, .slide-left-leave-from {
  opacity: 1;
  transform: translateX(0);
}
.slide-right-enter-active, .slide-right-leave-active {
  transition: transform 0.3s, opacity 0.3s;
}
.slide-right-enter-from, .slide-right-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
.slide-right-enter-to, .slide-right-leave-from {
  opacity: 1;
  transform: translateX(0);
}
.slide-down-enter-active, .slide-down-leave-active {
  transition: transform 0.3s, opacity 0.3s;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-40px);
}
.slide-down-enter-to, .slide-down-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.3s, opacity 0.3s;
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(40px);
}
.slide-up-enter-to, .slide-up-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.draggable-components {
  display: flex;
  flex-direction: column;
  width: 100%;

  gap: 12px;
}
.header {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 700;

  gap: 8px;
}
.draggable-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px 16px;
  border: 1px solid #cccccc;
  border-radius: 6px;
  background: #f5f5f5;
  font-size: 16px;
  cursor: grab;
  user-select: none;

  gap: 8px;
}
</style>
