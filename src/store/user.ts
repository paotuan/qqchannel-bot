import { defineStore } from 'pinia'
import type { IUser } from '../../interface/common'

export const useUserStore = defineStore('user', {
  state: () => ({
    map: {} as Record<string, IUser>
  }),
  getters: {
    list: state => Object.values(state.map)
  },
  actions: {
    setUsers(list: IUser[]) {
      list.forEach(user => {
        this.map[user.id] = user
      })
    },
    of(id: string) {
      return this.map[id]
    }
  }
})
