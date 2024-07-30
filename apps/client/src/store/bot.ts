import type { IBotInfo, ILoginReqV2, IBotConfig, IBotConfig_Kook, IBotConfig_QQ, IBotInfoResp } from '@paotuan/types'
import { defineStore } from 'pinia'
import ws from '../api/ws'
import { gtagEvent } from '../utils'
import { computed, ref } from 'vue'
import md5 from 'md5'
import { useChannelStore } from './channel'

type LoginState = 'NOT_LOGIN' | 'LOADING' | 'LOGIN'

// 注意 tab 与 platform 的不同。qq tab 下面可选 qq/qqguild 两个 platform
// 出于历史兼容原因，qq tab 使用 qqguild 作为枚举
export type LoginTab = 'qqguild' | 'kook'

// key 与 LoginTab 保持一致
type Platform2ConfigMap = {
  qqguild?: IBotConfig_QQ
  kook?: IBotConfig_Kook
}

export const useBotStore = defineStore('bot', () => {
  const [_tab, _model] = loadLocalLoginInfo()

  const tab = ref<LoginTab>(_tab ?? 'qqguild')

  const formQQ = ref<IBotConfig_QQ>(_model.qqguild ?? {
    platform: 'qqguild',
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
    switch (tab.value) {
    case 'qqguild':
      return formQQ.value
    case 'kook':
      return formKook.value
    default:
      throw new Error('invalid tab: ' + tab.value)
    }
  })

  const platform = computed(() => formModel.value.platform)

  const validateForm = () => {
    const form = formModel.value
    switch (form.platform) {
    case 'qqguild':
    case 'qq':
      return !!(form.appid && form.secret && form.token)
    case 'kook':
    {
      // calc uniq appid
      form.appid = md5(form.token)
      return !!form.token
    }
    default:
      return false
    }
  }

  const loginState = ref<LoginState>('NOT_LOGIN')

  const connect = () => {
    const model = formModel.value
    const isValid = validateForm()
    if (!isValid) return
    loginState.value = 'LOADING'
    gtagEvent('bot/login', { platform: model.platform }, false)
    saveLoginInfo2LocalStorage(_model, tab.value, model)
    ws.send<ILoginReqV2>({ cmd: 'bot/loginV2', data: model })
    ws.once('bot/loginV2', resp => {
      console.log('login success')
      onLoginFinish(!!resp.success)
    })
    // 开始监听 channel list
    const channelStore = useChannelStore()
    channelStore.waitForServerChannelList()
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

  return { tab, platform, formModel, loginState, connect, info }
})

function saveLoginInfo2LocalStorage(allData: Platform2ConfigMap, tab: LoginTab, model: IBotConfig) {
  localStorage.setItem('login-platform', tab)
  const newData: Platform2ConfigMap = { ...allData, [tab]: model }
  localStorage.setItem('login-model', JSON.stringify(newData))
}

function loadLocalLoginInfo(): [LoginTab | null, Platform2ConfigMap] {
  const tab  = localStorage.getItem('login-platform') as LoginTab | null
  const model: Platform2ConfigMap = (() => {
    try {
      return JSON.parse(localStorage.getItem('login-model') || '{}')
    } catch (e) {
      return {}
    }
  })()

  return [tab, model]
}
