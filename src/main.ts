import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import VueKonva from 'vue-konva'
import './api'
import { useUIStore } from './store/ui'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(VueKonva, { prefix: 'Konva'})

// set theme from localstorage
const ui = useUIStore()
ui.setTheme(ui.theme)

app.mount('#app')
