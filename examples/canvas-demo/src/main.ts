import graggableCanvas from '@jsjn/draggable-canvas'
import { createApp } from 'vue'
import App from './App.vue'
import './rem'
import '@jsjn/draggable-canvas/index.css'
// import './style.css'

createApp(App).use(graggableCanvas).mount('#app')
