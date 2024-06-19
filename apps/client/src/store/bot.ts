import type { IBotInfo, ILoginReqV2, IBotConfig, IBotConfig_Kook, IBotConfig_QQ, IBotInfoResp } from '@paotuan/types'
import { defineStore } from 'pinia'
import ws from '../api/ws'
import { gtagEvent } from '../utils'
import { computed, ref } from 'vue'
import type { Platform } from '@paotuan/config'
import md5 from 'md5'

type LoginState = 'NOT_LOGIN' | 'LOADING' | 'LOGIN'

type Platform2ConfigMap = {
  qqguild?: IBotConfig_QQ
  kook?: IBotConfig_Kook
}

export const useBotStore = defineStore('bot', () => {
  const [_platform, _model] = loadLocalLoginInfo()

  const platform = ref<Platform>(_platform ?? 'qqguild')

  const formQQ = ref<IBotConfig_QQ>(_model.qqguild ?? {
    platform: 'qqguild', // 群和频道是一起的，但现在暂时只支持通过频道登录
    appid: '',
    secret: '',
    token: '',
    sandbox: false,
    type: 'private'
  })

  const formKook = ref<IBotConfig_Kook>(_model.kook ?? {
    platform: 'kook',
    appid: '',
    token: ''
  })

  const formModel = computed(() => {
    switch (platform.value) {
    case 'qqguild':
      return formQQ.value
    case 'kook':
      return formKook.value
    default:
      return null
    }
  })

  const formModelIsValid = computed(() => {
    switch (platform.value) {
    case 'qqguild':
    {
      const form = formQQ.value
      return !!(form.appid && form.secret && form.token)
    }
    case 'kook':
    {
      const form = formKook.value
      // calc uniq appid
      form.appid = md5(form.token)
      return !!form.token
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
    saveLoginInfo2LocalStorage(_model, model)
  }

  const onLoginFinish = (success: boolean) => {
    loginState.value = success ? 'LOGIN' : 'NOT_LOGIN'
    // 登录成功，拉取 bot 信息
    if (success) {
      ws.send({ cmd: 'bot/info', data: null })
      ws.once<IBotInfoResp>('bot/info', resp => {
        info.value = resp.data
        if (info.value) {
          gtagEvent('bot/info', { bot_name: info.value.username }, false)
        }
      })
    }
  }

  const info = ref<IBotInfo | null>(null)

  return { platform, formModel, loginState, connect, onLoginFinish, info }
})

function saveLoginInfo2LocalStorage(allData: Platform2ConfigMap, model: IBotConfig) {
  localStorage.setItem('login-platform', model.platform)
  const newData = { ...allData, [model.platform]: model }
  localStorage.setItem('login-model', JSON.stringify(newData))
}

function loadLocalLoginInfo(): [Platform | null, Platform2ConfigMap] {
  const platform  = localStorage.getItem('login-platform') as Platform | null
  const model: Platform2ConfigMap = (() => {
    try {
      return JSON.parse(localStorage.getItem('login-model') || '{}')
    } catch (e) {
      return {}
    }
  })()

  return [platform, model]
}
