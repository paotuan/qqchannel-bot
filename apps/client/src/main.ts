import * as Vue from 'vue'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueKonva from 'vue-konva'
import { enableVueBindings } from '@syncedstore/core'
import './style.css'
import App from './App.vue'
import './api'
import router from './router'
import { useUIStore } from './store/ui'

enableVueBindings(Vue)

const app = createApp(App)
app.use(VueKonva, { prefix: 'Konva'})

const pinia = createPinia()
app.use(pinia)

app.use(router)

// set theme from localstorage
const ui = useUIStore()
ui.setTheme(ui.theme)

app.mount('#app')
