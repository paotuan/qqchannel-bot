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
        // 机器人去除测试中尾缀
        if (user.bot) {
          user.nick = user.nick.replace(/-测试中$/, '')
          user.username = user.username.replace(/-测试中$/, '')
        }
        this.map[user.id] = user
      })
    },
    addOrUpdateUser(newUser: IUser) {
      const user = this.map[newUser.id]
      if (!user) {
        this.map[newUser.id] = newUser
      } else {
        user.nick = newUser.nick ?? user.nick
        user.username = newUser.username ?? user.username
        user.avatar = newUser.avatar ?? user.avatar
        user.bot = newUser.bot
        user.deleted = newUser.deleted
      }
    },
    of(id: string) {
      return this.map[id]
    },
    nickOf(id: string) {
      const user = this.of(id)
      return user ? user.nick || user.username : ''
    }
  }
})
