<script lang="ts" setup>
import type { Rect } from '../types'
import { Icon } from '@iconify/vue'
import { computed, defineEmits, defineProps } from 'vue'
import { CanvasItemType } from '../enum'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  rect: Rect | null
  rects: Rect[]
  fullscreen: boolean

}>()
const emit = defineEmits(['action'])

const hasFullscreen = computed(() => {
  return props.rects.some(r => r._prevRect)
})
</script>

<template>
  <ul
    v-if="visible"
    class="context-menu"
    :style="{ left: `${x}px`, top: `${y}px` }"
    @mousedown.stop
  >
    <li v-if="!rect?._prevRect" @click="$emit('action', 'up')">
      <Icon icon="tabler:arrow-down" width="24" height="24" />下移
    </li>
    <li v-if="!rect?._prevRect" @click="$emit('action', 'down')">
      <Icon icon="tabler:arrow-up" width="24" height="24" />上移
    </li>
    <li v-if="!rect?._prevRect" @click="$emit('action', 'top')">
      <Icon icon="icon-park-outline:to-top" width="24" height="24" />置于顶部
    </li>
    <li v-if="!rect?._prevRect" @click="$emit('action', 'bottom')">
      <Icon icon="icon-park-outline:to-bottom" width="24" height="24" />置于底部
    </li>
    <li v-if="!rect?._prevRect && !hasFullscreen && [CanvasItemType.Background].includes(rect!.type)" @click="$emit('action', 'fullscreen')">
      <Icon icon="material-symbols:fullscreen" width="24" height="24" />全屏
    </li>
    <li v-if="rect?._prevRect && hasFullscreen && [CanvasItemType.Background].includes(rect!.type)" @click="$emit('action', 'fullscreen')">
      <Icon icon="material-symbols:fullscreen-exit" width="24" height="24" />恢复
    </li>
    <li class="danger" @click="$emit('action', 'delete')">
      <Icon icon="material-symbols:delete-forever-outline" width="24" height="24" /> 删除
    </li>
    <li @click="$emit('action', 'cancel')">
      <Icon icon="material-symbols:close-rounded" width="24" height="24" /> 取消
    </li>
  </ul>
</template>

<style scoped>
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
</style>
