import { defineStore } from 'pinia'
import type { ILog } from '../../interface/common'

export const useLogStore = defineStore('log', {
  state: () => ({
    logs: [] as ILog[]
  }),
  actions: {
    addLogs(logs: ILog[]) {
      this.logs.push(...logs)
      // todo save local (in watch?)
    },
    clear() {
      this.logs.length = 0
    }
  }
})
