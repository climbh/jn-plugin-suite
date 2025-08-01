<script lang="ts" setup>
import type { ComputedRef } from 'vue'
import type { Rect } from './types'
import { computed, defineEmits, defineProps, inject, toRef } from 'vue'
import { useDraggableRect } from './hooks/useDraggableRect'

defineOptions({
  name: 'DraggableRect',
})

const props = defineProps<{
  rect: Rect
}>()
const emit = defineEmits(['update', 'dropItem'])
const production = inject<ComputedRef<boolean>>('draggableCanvasProduction')
const mode = inject<ComputedRef<boolean>>('draggableCanvasMode')
const rectRef = toRef(props, 'rect')

const {
  rectStyle,
  onMouseDown: baseOnMouseDown,
  onResizeStart: baseOnResizeStart,
  onDrop,
} = useDraggableRect({
  id: props.rect.id,
  rect: rectRef,
  emitUpdate: rect => emit('update', rect),
  emitDropItem: (id, item) => emit('dropItem', id, item),
})

const isFullscreen = computed(() => {
  return !!props.rect._prevRect
})

function onMouseDown(e: MouseEvent) {
  if (isFullscreen.value || production?.value)
    return
  baseOnMouseDown(e)
}
function onResizeStart(type: any, e: MouseEvent) {
  if (isFullscreen.value || production?.value)
    return
  baseOnResizeStart(type, e)
}
</script>

<template>
  <div
    class="draggable-rect"
    :class="{ production, fullscreen: isFullscreen }"
    :style="{
      ...rectStyle,
      pointerEvents: isFullscreen ? 'none' : 'auto',
    }"
    :data-id="rect.id"
    @mousedown.stop="onMouseDown"
    @dragover.prevent
    @drop="onDrop"
  >
    <div class="content" :class="[mode]">
      <slot />
    </div>
    <!-- 8个缩放点 -->
    <div class="resize-handle handle-rt" @mousedown.stop.prevent="e => onResizeStart('right-top', e)" />
    <div class="resize-handle handle-rb" @mousedown.stop.prevent="e => onResizeStart('right-bottom', e)" />
    <div class="resize-handle handle-lt" @mousedown.stop.prevent="e => onResizeStart('left-top', e)" />
    <div class="resize-handle handle-lb" @mousedown.stop.prevent="e => onResizeStart('left-bottom', e)" />
    <div class="resize-handle handle-t" @mousedown.stop.prevent="e => onResizeStart('top', e)" />
    <div class="resize-handle handle-b" @mousedown.stop.prevent="e => onResizeStart('bottom', e)" />
    <div class="resize-handle handle-l" @mousedown.stop.prevent="e => onResizeStart('left', e)" />
    <div class="resize-handle handle-r" @mousedown.stop.prevent="e => onResizeStart('right', e)" />
  </div>
</template>

<style lang="scss" scoped>
.draggable-rect {
  min-width: 40px;
  min-height: 40px;
  // box-shadow: 0 2px 8px #0001;
  background-color: transparent;
  &.production {
    border: none !important;
    box-shadow: none !important;
    & > .content {
      overflow: visible;
    }
  }
}

.content {
  // overflow: hidden;
  width: 100%;
  height: 100%;
}

.selected {
  .resize-handle {
    position: absolute;
    width: 10px;
    height: 10px;
    border: 2px solid #ffffff;
    /* border-radius: 50%; */
    background: #1890ff;
    box-shadow: 0 1px 4px #0002;
    cursor: pointer;
  }
  .handle-rt {
    top: -6px;
    right: -6px;
    cursor: ne-resize;
  }
  .handle-rb {
    right: -6px;
    bottom: -6px;
    cursor: se-resize;
  }
  .handle-lt {
    top: -6px;
    left: -6px;
    cursor: nw-resize;
  }
  .handle-lb {
    bottom: -6px;
    left: -6px;
    cursor: sw-resize;
  }
  .handle-t {
    top: -6px;
    left: 50%;
    cursor: n-resize;
    transform: translateX(-50%);
  }
  .handle-b {
    bottom: -6px;
    left: 50%;
    cursor: s-resize;
    transform: translateX(-50%);
  }
  .handle-l {
    top: 50%;
    left: -6px;
    cursor: w-resize;
    transform: translateY(-50%);
  }
  .handle-r {
    top: 50%;
    right: -6px;
    cursor: e-resize;
    transform: translateY(-50%);
  }
}
</style>

<style lang="scss">
.fullscreen {
  pointer-events: none;
  * {
    pointer-events: none;
  }
}
</style>
