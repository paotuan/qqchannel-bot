import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import './api'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')
