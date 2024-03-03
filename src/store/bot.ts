import type { IBotInfo, ILoginReqV2 } from '../../interface/common'
import { defineStore } from 'pinia'
import ws from '../api/ws'
import { gtagEvent } from '../utils'
import { computed, ref } from 'vue'
import type { IBotConfig, IBotConfig_QQ, Platform } from '../../interface/platform/login'

type LoginState = 'NOT_LOGIN' | 'LOADING' | 'LOGIN'

export const useBotStore = defineStore('bot', () => {
  const [_platform, _model] = loadLocalLoginInfo()

  const platform = ref<Platform>(_platform ?? 'qq')
  const formQQ = ref<IBotConfig_QQ>(_model.qq ?? {
    platform: 'qq',
    appid: '',
    secret: '',
    token: '',
    sandbox: false,
    type: 'private'
  })

  const formModel = computed(() => {
    switch (platform.value) {
    case 'qq':
      return formQQ.value
    default:
      return null
    }
  })

  const formModelIsValid = computed(() => {
    switch (platform.value) {
    case 'qq':
    {
      const form = formQQ.value
      return !!(form.appid && form.secret && form.token)
    }
    default:
      return false
    }
  })

  const loginState = ref<LoginState>('NOT_LOGIN')

  const connect = () => {
    const model = formModel.value
    if (!model) return
    const isValid = formModelIsValid.value
    if (!isValid) return
    loginState.value = 'LOADING'
    ws.send<ILoginReqV2>({ cmd: 'bot/loginV2', data: model })
    gtagEvent('bot/login', { platform: model.platform }, false)
    saveLoginInfo2LocalStorage(platform.value, model)
  }

  const onLoginFinish = (success: boolean) => {
    loginState.value = success ? 'LOGIN' : 'NOT_LOGIN'
  }

  const info = ref<IBotInfo | null>(null)

  return { platform, formQQ, formModel, loginState, connect, onLoginFinish, info }
})

function saveLoginInfo2LocalStorage(platform: Platform, model: IBotConfig) {
  localStorage.setItem('login-platform', platform)
  localStorage.setItem('login-model', JSON.stringify(model))
}

type Platform2ConfigMap = {
  qq?: IBotConfig_QQ
  kook?: never
}

function loadLocalLoginInfo(): [Platform | null, Platform2ConfigMap] {
  const platform  = localStorage.getItem('login-platform') as Platform | null
  const model: Platform2ConfigMap = (() => {
    if (!platform) return {}
    const str = localStorage.getItem('login-model')
    if (!str) return {}
    try {
      return { [platform]: JSON.parse(str) as Platform2ConfigMap[typeof platform] }
    } catch (e) {
      return {}
    }
  })()

  return [platform, model]
}
