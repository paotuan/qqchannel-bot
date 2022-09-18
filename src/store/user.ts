import { defineStore } from 'pinia'
import type { IUser } from '../../interface/common'

export const useUserStore = defineStore('user', {
  state: () => ({
    list: [] as IUser[]
  })
})
