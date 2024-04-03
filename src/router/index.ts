import { createRouter, createWebHistory } from 'vue-router'

const LogPanel = () => import('../views/LogPanel/LogPanel.vue')
const NotePanel = () => import('../views/NotePanel/NotePanel.vue')
const CardPanel = () => import('../views/CardPanel/CardPanel.vue')
const ScenePanel = () => import('../views/ScenePanel/ScenePanel.vue')
const ConfigPanel = () => import('../views/ConfigPanel/ConfigPanel.vue')


const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/log' },
    { path: '/log', component: LogPanel },
    { path: '/note', component: NotePanel },
    { path: '/card', component: CardPanel },
    { path: '/scene', component: ScenePanel },
    { path: '/config', component: ConfigPanel },
  ]
})

export default router
