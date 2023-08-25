import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import VueKonva from 'vue-konva'
import './api'
import { useUIStore } from './store/ui'

const app = createApp(App)
app.use(VueKonva, { prefix: 'Konva'})

const pinia = createPinia()
app.use(pinia)

// set theme from localstorage
const ui = useUIStore()
ui.setTheme(ui.theme)

app.mount('#app')
