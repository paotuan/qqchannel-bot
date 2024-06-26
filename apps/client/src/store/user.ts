import { defineStore } from 'pinia'
import type { YGuildState } from '@paotuan/types'

export const useUserStore = defineStore('user', {
  state: () => ({
    yGuildStore: null as YGuildState | null
  }),
  getters: {
    map: state => state.yGuildStore?.users ?? {},
    list: state => Object.values(state.yGuildStore?.users ?? {}),
    enabledUserList: state => Object.values(state.yGuildStore?.users ?? {}).filter(user => !user.isBot && !user.deleted)
  },
  actions: {
    of(id: string) {
      return this.map[id]
    },
    nickOf(id: string) {
      const user = this.of(id)
      return user?.name ?? ''
    }
  }
})
