import type { App } from 'vue'
import Canvas from './Canvas.vue'
import DraggableItem from './DraggableItem.vue'
import DraggableRect from './DraggableRect.vue'
import './assets/style/tag.scss'

const components = [Canvas, DraggableRect, DraggableItem]

const DraggableCanvas = {
  install(app: App) {
    components.forEach((comp) => {
      app.component((comp as any).name || comp.__name, comp)
    })
  },
}

export default DraggableCanvas
export { Canvas, DraggableItem, DraggableRect }
export * from './enum'
export * from './types'
