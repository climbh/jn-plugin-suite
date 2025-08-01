<script lang="ts" setup>
defineOptions({
  name: 'DraggableItem',
})

defineProps<{ id: string }>()

function onDragStart(e: DragEvent) {
  e.dataTransfer?.setData('draggable-item-id', String((e.target as HTMLElement).id || ''))
}
</script>

<template>
  <div
    class="draggable-item"
    draggable="true"
    @dragstart="onDragStart"
  >
    <slot>元素</slot>
  </div>
</template>

<style scoped>
.draggable-item {
  display: inline-block;
  padding: 4px 12px;
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: grab;
  user-select: none;
}
</style>
