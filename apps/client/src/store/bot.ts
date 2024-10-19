import type {
  IBotInfo,
  ILoginReqV2,
  IBotConfig,
  IBotConfig_Kook,
  IBotConfig_QQ,
  IBotConfig_Satori,
  IBotInfoResp,
  IChannel
} from '@paotuan/types'
import { defineStore } from 'pinia'
import ws from '../api/ws'
import { gtagEvent, isFromRefresh } from '../utils'
import { computed, ref } from 'vue'
import md5 from 'md5'
import { useChannelStore } from './channel'
import { localStorageGet, localStorageSet, sessionStorageGet, sessionStorageSet } from '../utils/cache'

type LoginState = 'NOT_LOGIN' | 'LOADING' | 'LOGIN'

// 注意 tab 与 platform 的不同。qq tab 下面可选 qq/qqguild 两个 platform
// 出于历史兼容原因，qq tab 使用 qqguild 作为枚举
const AvailableLoginTabs = ['qqguild', 'kook', 'satori'] as const
export type LoginTab = typeof AvailableLoginTabs[number]

// key 与 LoginTab 保持一致
type Platform2ConfigMap = {
  qqguild?: IBotConfig_QQ
  kook?: IBotConfig_Kook
  satori?: IBotConfig_Satori
}

export const useBotStore = defineStore('bot', () => {
  const [_tab, _model] = loadLocalLoginInfo()

  const tab = ref<LoginTab>(_tab)

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

  const formSatori = ref<IBotConfig_Satori>(_model.satori ?? {
    platform: 'satori',
    appid: '',
    endpoint: '',
    token: ''
  })

  const formModel = computed(() => {
    switch (tab.value) {
    case 'qqguild':
      return formQQ.value
    case 'kook':
      return formKook.value
    case 'satori':
      return formSatori.value
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
    case 'satori':
    {
      // calc uniq appid
      form.appid = md5(form.endpoint)
      if (!form.token) form.token = undefined
      return !!form.endpoint
    }
    default:
      return false
    }
  }

  const loginState = ref<LoginState>('NOT_LOGIN')

  const connect = () => {
    const model = formModel.value
    const isValid = validateForm()
    if (!isValid) return false
    return new Promise<boolean>(resolve => {
      loginState.value = 'LOADING'
      gtagEvent('bot/login', { platform: model.platform }, false)
      saveLoginInfo2LocalStorage(_model, tab.value, model)
      sessionStorageSet('login-step', String(1))
      ws.send<ILoginReqV2>({ cmd: 'bot/loginV2', data: model })
      ws.once('bot/loginV2', resp => {
        console.log('login success')
        onLoginFinish(!!resp.success)
        resolve(!!resp.success)
      })
      // 开始监听 channel list
      const channelStore = useChannelStore()
      channelStore.waitForServerChannelList()
    })
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

  // 自动登录逻辑
  const isAutoLoginLoading = ref(true)
  const tryAutoLogin = async () => {
    // 1. 如果从当前页面刷新，则尝试自动登录
    // 如果不是刷新操作则不自动登录，因为几乎没有两个页面登录同一个子频道的需求场景
    if (isFromRefresh()) {
      isAutoLoginLoading.value = true
      try {
        const loginStep = sessionStorageGet<number>('login-step', 0)
        // 1.1 登录机器人
        if (loginStep < 1) return // 刷新前未登录
        if (!(await connect())) return // 没有已保存的登录凭据，或登录失败
        // 1.2 登录子频道
        if (loginStep < 2) return // 刷新前未登录子频道
        const loginChannel = localStorageGet<IChannel | null>('login-channel', null)
        if (!loginChannel) return // 没有已保存的子频道
        await useChannelStore().listenTo(loginChannel)
      } finally {
        isAutoLoginLoading.value = false
      }
      return
    }
    // 2. 如果从“我要多开”打开，则尝试自动登录机器人
    // 目前只有一处地方，直接用 opener 判断了
    if (window.opener && window.opener !== window) {
      isAutoLoginLoading.value = true
      await connect()
      isAutoLoginLoading.value = false
      return
    }
    isAutoLoginLoading.value = false
  }

  return { tab, platform, formModel, loginState, connect, info, isAutoLoginLoading, tryAutoLogin }
})

function saveLoginInfo2LocalStorage(allData: Platform2ConfigMap, tab: LoginTab, model: IBotConfig) {
  localStorageSet('login-platform', tab)
  const newData: Platform2ConfigMap = { ...allData, [tab]: model }
  localStorageSet('login-model', JSON.stringify(newData))
}

function loadLocalLoginInfo(): [LoginTab, Platform2ConfigMap] {
  let tab  = localStorageGet<LoginTab>('login-platform', 'qqguild')
  // tab 枚举值容错
  if (tab && !AvailableLoginTabs.includes(tab)) {
    tab = 'qqguild'
  }
  const model = localStorageGet<Platform2ConfigMap>('login-model', {})

  return [tab, model]
}
