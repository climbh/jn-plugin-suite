# draggable-canvas

一个基于 Vue3 + TypeScript 开发的可拖拽画布组件，支持在画布上添加矩形容器，矩形内可嵌入`背景图`，`文本`，`登录`三种组件，以此来实现自定义页面的功能。****

## 功能特性

- 可拖拽缩放的画布
- 画布上可添加矩形容器
- 矩形支持拖拽、缩放
- 支持将外部元素拖入矩形内部并自由拖动
- 右键菜单支持

## 安装

```bash
pnpm add @jsjn/draggable-canvas
# 或
npm install @jsjn/draggable-canvas
```

## 使用方法

### 全局注册

```ts
import DraggableCanvas from '@jsjn/draggable-canvas'
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.use(DraggableCanvas)
app.mount('#app')
```

### 基础使用

```vue
<script setup lang="ts">
import { CanvasItemType, Rect } from '@jsjn/draggable-canvas'
import { ref } from 'vue'

const rects = ref<Rect[]>([])

const initRects = ref<Rect[]>([])

function handleRectAdd(rect: any) {
  console.log('矩形已添加:', rect)
}

function handleUpdateSelect(rect: any) {
  console.log('矩形已更新:', rect)
}

function handleRectSelect(rect: any) {
  console.log('矩形已选中:', rect)
}

/**
 * 处理选择的图片
 * 正常是要上传到服务器，然后返回一个url
 */
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
    mode="create"
    :initial-rects="initRects"
    :transform-content="transformContentHandle"
    @add-rect="handleRectAdd"
    @update-rect="handleUpdateSelect"
    @select-rect="handleRectSelect"
  />
</template>
```

## API 文档

### DraggableCanvas

#### Props

| 属性名 | 必填 | 类型 | 默认值 | 说明 |
|--------|------|--------|--------|------|
| mode | 否 | `enum` | create | create, review, production |
| initial-rects | 否 | `Array<Rect>` | [] | 初始化数据 |
| transform-content | 是 | `(type: CanvasItemType, data: any) => Promise<any>` | undefined | 对数据内容进行转换 |

#### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `add-rect` | `(rect: Rect)` | 添加矩形时触发 |
| `select-rect` | `(rect: Rect)` | 选中矩形时触发 |
| `update-rect` | `(rect: Rect)` | 更新矩形时触发 |
