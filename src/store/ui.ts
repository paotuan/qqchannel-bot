import { defineStore } from 'pinia'

export type Tabs = 'log' | 'note' | 'card'

export const useUIStore = defineStore('ui', {
  state: () => ({
    activeTab: 'log' as Tabs,
    statusAlertVisible: true
  })
})
