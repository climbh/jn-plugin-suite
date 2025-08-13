<script lang="ts" setup>
// import type { CanvasItemType, Rect } from '@jsjn/draggable-canvas'
import { CanvasItemType, type Rect } from '@jsjn/draggable-canvas'
import { ref, watch } from 'vue'

const rects = ref<Rect[]>([])

function handleAddRect(val: any) {
  // console.log('%c [ handleAddRect ]-13', 'font-size:13px; background:blue; color:#fff;', val)
}

function handleUpdateRect(val: any) {
  // console.log('%c [ handleUpdateRect ]-17', 'font-size:13px; background:blue; color:#fff;', val)
}

function handleDropItem(id: string, item: any) {
  // console.log('%c [ handleDropItem ]-23', 'font-size:13px; background:blue; color:#fff;', id, item)
}

const initialRects = ref([
  {
    content: '<p><span style="font-size: 32px; color: #e53935">1313123132</span></p>',
    height: 227,
    id: '1753337356076',
    originalPageSize: { width: 1512, height: 741, rootSize: 78.75 },
    type: 1,
    width: 265,
    x: 151,
    y: 77,
  },
  {
    content: '<p><span style="font-size: 42px; color: #3949ab"><strong>1231313123</strong></span></p>',
    height: 342,
    id: '1753338376773',
    originalPageSize: { width: 1920, height: 934, rootSize: 100 },
    type: 1,
    width: 397,
    x: 12,
    y:
578,
  },
  // {
  //   height: 538,
  //   id: '1753232512368',
  //   originalPageSize: { width: 1920, height: 867 },
  //   type: 2,
  //   width: 516,
  //   x: 1305,
  //   y: 171,
  // },
  // {
  //   content: '<p style="text-align: center"><span style="font-size: 42px; color: #e53935">中华人民共和国</span></p>',
  //   height: 82,
  //   id: '1753232545167',
  //   originalPageSize: { width: 1920, height: 867 },
  //   type: 1,
  //   width: 582,
  //   x: 633,
  //   y: 1,
  // },

  // {
  //   content: '<p><span style="font-size: 52px"><strong>中共</strong></span><span style="font-size: 52px; color: #e53935"><strong>江苏省</strong></span><span style="font-size: 52px"><strong>委金融办<em><s>鑫安系统</s></em></strong></span></p>',
  //   height: 96,
  //   id: '1751254285271',
  //   type: 1,
  //   originalPageSize: { width: 1512, height: 741 },
  //   unit: 'px',
  //   width: 701,
  //   x: 472,
  //   y: 6,
  // },
  // {
  //   content: '<p><span style="font-size: 28px"><strong>LOGO</strong></span></p>',
  //   height: 102,
  //   id: '1751508491599',
  //   type: 1,
  //   originalPageSize: { width: 1512, height: 741 },
  //   unit: 'px',
  //   width: 109,
  //   x: 356,
  //   y: 4,
  // },
  // {
  //   height: 435,
  //   id: '1751509264615',
  //   type: 2,
  //   originalPageSize: { width: 1512, height: 741 },
  //   unit: 'px',
  //   width: 431,
  //   x: 935,
  //   y: 166,
  // },
])

watch(rects, (val) => {
  console.log('%c [ rects ]-19', 'font-size:13px; background:blue; color:#fff;', val)
})

function transformContentHandle(type: CanvasItemType, data: any) {
  if (type === CanvasItemType.Background) {
    return new Promise((rs, rj) => {
      const file = data as File
      setTimeout(() => {
        rs('https://picsum.photos/800/600')
      }, 3000)
    })
  }
}
</script>

<template>
  <DraggableCanvas
    v-model:rects="rects"
    :initial-rects="initialRects"
    mode="create"
    :transform-content="transformContentHandle"
    @add-rect="handleAddRect"
    @update-rect="handleUpdateRect"
    @drop-item="handleDropItem"
  />
</template>

<style lang="scss" scoped></style>
