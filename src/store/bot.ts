import { reactive, ref } from 'vue'
import ws from './ws'
import type { ILoginReq, IBotInfoResp } from '../../interface/common'

export const loginForm = reactive<ILoginReq>({
  appid: localStorage.getItem('appid') || '',
  token: localStorage.getItem('token') || ''
})

type LoginState = 'NOT_LOGIN' | 'LOADING' | 'LOGIN'
export const loginState = ref<LoginState>('NOT_LOGIN')

export const botInfo = ref<IBotInfoResp | null>(null)

ws.on('bot/login', message => {
  console.log('login success')
  loginState.value = message.success ? 'LOGIN' : 'NOT_LOGIN'
  // 极端情况下会有异步的问题，不过这里很快，就不管了
  localStorage.setItem('appid', loginForm.appid)
  localStorage.setItem('token', loginForm.token)
})

ws.on('bot/info', message => {
  botInfo.value = message.data as IBotInfoResp
  console.log(message.data)
})
