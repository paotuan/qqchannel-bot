import { defineStore } from 'pinia'
import type { IUser } from '@paotuan/types'

export const useUserStore = defineStore('user', {
  state: () => ({
    map: {} as Record<string, IUser>
  }),
  getters: {
    list: state => Object.values(state.map),
    enabledUserList: state => Object.values(state.map).filter(user => !user.isBot && !user.deleted)
  },
  actions: {
    setUsers(list: IUser[]) {
      list.forEach(user => {
        // 机器人去除测试中尾缀
        if (user.isBot) {
          user.name = user.name.replace(/-测试中$/, '')
        }
        this.map[user.id] = user
      })
    },
    of(id: string) {
      return this.map[id]
    },
    nickOf(id: string) {
      const user = this.of(id)
      return user?.name ?? ''
    }
  }
})
