import type { IBotInfo, ILoginReq } from '../../interface/common'
import { defineStore } from 'pinia'
import ws from '../api/ws'
import { gtagEvent } from '../utils'

type LoginState = 'NOT_LOGIN' | 'LOADING' | 'LOGIN'

export const useBotStore = defineStore('bot', {
  state: () => ({
    appid: localStorage.getItem('appid') || '',
    token: localStorage.getItem('token') || '',
    sandbox: defaultSandbox(),
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
      ws.send<ILoginReq>({ cmd: 'bot/login', data: { appid: this.appid, token: this.token, sandbox: this.sandbox } })
      gtagEvent('bot/login', {}, false)
    }
  }
})

function defaultSandbox() {
  try {
    const str = localStorage.getItem('sandbox')
    return str === 'true'
  } catch (e) {
    return false
  }
}
