import { defineStore } from 'pinia'

export type Tabs = 'log' | 'note' | 'card'
export type ToastType = 'success' | 'warning' | 'info' | 'error'
let toastId = 0

export const useUIStore = defineStore('ui', {
  state: () => ({
    activeTab: 'log' as Tabs,
    statusAlertVisible: true,
    toasts: [] as { id: number, type: ToastType, msg: string }[]
  }),
  actions: {
    toast(type: ToastType, msg: string) {
      const obj = { type, msg, id: ++toastId }
      this.toasts.push(obj)
      setTimeout(() => {
        const index = this.toasts.indexOf(obj)
        if (index >= 0) {
          this.toasts.splice(index, 1)
        }
      }, 5000)
    }
  }
})
