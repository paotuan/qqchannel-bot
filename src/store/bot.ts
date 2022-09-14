import { reactive, ref } from 'vue'
import type { ILoginReq, IService } from '../../interface/common'

export const loginForm = reactive<ILoginReq>({
  appid: '',
  token: ''
})

type LoginState = 'NOT_LOGIN' | 'LOADING' | 'LOGIN'
export const loginState = ref<LoginState>('NOT_LOGIN')

export const BotService: IService = {
  handleMessage(message) {
    switch (message.cmd) {
    // 登录成功
    case 'bot/login':
      console.log('login success')
      loginState.value = message.success ? 'LOGIN' : 'NOT_LOGIN'
      break
    }
  }
}
