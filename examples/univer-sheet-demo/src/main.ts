import UniverSheet from '@jsjn/univer-sheet'
import { createApp } from 'vue'
import App from './App.vue'
import '@jsjn/univer-sheet/index.css'
import './style.css'

createApp(App).use(UniverSheet).mount('#app')
