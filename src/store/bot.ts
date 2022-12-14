import type { IBotInfo } from '../../interface/common'
import { defineStore } from 'pinia'
import ws from '../api/ws'
import { gtagEvent } from '../utils'

type LoginState = 'NOT_LOGIN' | 'LOADING' | 'LOGIN'

export const useBotStore = defineStore('bot', {
  state: () => ({
    appid: localStorage.getItem('appid') || '',
    token: localStorage.getItem('token') || '',
    loginState: 'NOT_LOGIN' as LoginState,
    info: null as IBotInfo | null
  }),
  getters: {
    botId: state => state.info?.id || ''
  },
  actions: {
    connect() {
      if (!this.appid || !this.token) return
      this.loginState = 'LOADING'
      ws.send({ cmd: 'bot/login', data: { appid: this.appid, token: this.token } })
      gtagEvent('bot/login', {}, false)
    }
  }
})
