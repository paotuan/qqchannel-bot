import type {
  IBotInfo,
  ILoginReqV2,
  IBotConfig,
  IBotConfig_Kook,
  IBotConfig_QQ,
  IBotConfig_Satori,
  IBotInfoResp,
  IChannel, IBotConfig_OneBot
} from '@paotuan/types'
import { defineStore } from 'pinia'
import ws from '../api/ws'
import { gtagEvent, isFromRefresh } from '../utils'
import { computed, ref } from 'vue'
import md5 from 'md5'
import { useChannelStore } from './channel'
import { localStorageGet, localStorageSet, sessionStorageGet, sessionStorageSet } from '../utils/cache'
import { merge } from 'lodash'

type LoginState = 'NOT_LOGIN' | 'LOADING' | 'LOGIN'

// 注意 tab 与 platform 的不同。qq tab 下面可选 qq/qqguild 两个 platform
// 出于历史兼容原因，qq tab 使用 qqguild 作为枚举
const AvailableLoginTabs = ['qqguild', 'kook', 'satori', 'onebot'] as const
export type LoginTab = typeof AvailableLoginTabs[number]

// key 与 LoginTab 保持一致
// 即使是非必填字段，在输入框中也是空字符串，因此使用 Required 包裹，避免声明时遗漏字段以及便于在提交时进行处理
type Platform2ConfigMap = {
  qqguild?: Required<IBotConfig_QQ>
  kook?: Required<IBotConfig_Kook>
  satori?: Required<IBotConfig_Satori>
  onebot?: Required<IBotConfig_OneBot>
}

export const useBotStore = defineStore('bot', () => {
  const [_tab, _model] = loadLocalLoginInfo()

  const tab = ref<LoginTab>(_tab)

  const formQQ = ref<Required<IBotConfig_QQ>>(merge({
    platform: 'qqguild',
    appid: '',
    secret: '',
    token: '',
    sandbox: false,
    type: 'private'
  }, _model.qqguild))

  const formKook = ref<Required<IBotConfig_Kook>>(merge({
    platform: 'kook',
    appid: '',
    token: ''
  }, _model.kook))

  const formSatori = ref<Required<IBotConfig_Satori>>(merge({
    platform: 'satori',
    appid: '',
    endpoint: '',
    token: ''
  }, _model.satori))

  const formOnebot = ref<Required<IBotConfig_OneBot>>(merge({
    platform: 'onebot',
    protocol: 'ws',
    appid: '',
    endpoint: '',
    token: '',
    path: 'onebot',
    port: 4176
  }, _model.onebot))

  const formModel = computed(() => {
    switch (tab.value) {
    case 'qqguild':
      return formQQ.value
    case 'kook':
      return formKook.value
    case 'satori':
      return formSatori.value
    case 'onebot':
      return formOnebot.value
    default:
      throw new Error('invalid tab: ' + tab.value)
    }
  })

  // 是否使用离线模式
  const offlineMode = ref(false)

  const platform = computed(() => offlineMode.value ? 'offline' : formModel.value.platform)

  // 转换数据结构用于提交，返回 falsy 代表校验不通过
  const validateAndTransformForm = () => {
    const form = formModel.value
    switch (form.platform) {
    case 'qqguild':
    case 'qq':
      return (form.appid && form.secret && form.token) ? form as IBotConfig_QQ : false
    case 'kook':
    {
      // calc uniq appid
      form.appid = md5(form.token)
      return form.token ? form as IBotConfig_Kook : false
    }
    case 'satori':
    {
      if (!form.endpoint) return false
      return {
        ...form,
        appid: md5(form.endpoint), // calc uniq appid
        token: form.token || undefined
      } as IBotConfig_Satori
    }
    case 'onebot':
    {
      if (!form.appid) return false
      if (form.protocol === 'ws') {
        if (!form.endpoint) return false
        return {
          ...form,
          token: form.token || undefined
        } as IBotConfig_OneBot
      } else if (form.protocol === 'ws-reverse') {
        return {
          ...form,
          path: '/' + form.path,
        } as IBotConfig_OneBot
      }
      return false
    }
    default:
      return false
    }
  }

  const loginState = ref<LoginState>('NOT_LOGIN')

  const connect = () => {
    const model = formModel.value
    const req = validateAndTransformForm()
    if (!req) return false
    return new Promise<boolean>(resolve => {
      loginState.value = 'LOADING'
      gtagEvent('bot/login', { platform: model.platform }, false)
      saveLoginInfo2LocalStorage(_model, tab.value, model)
      sessionStorageSet('login-step', String(1))
      ws.send<ILoginReqV2>({ cmd: 'bot/loginV2', data: req })
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

  // 离线模式登录
  // 简化原有的登录流程，只需在我们自己的系统内建立 mock 的 guild 和 channel ystore，无需在 server 实际生成 bot 实例
  const connectOffline = () => {
    offlineMode.value = true
    return new Promise<boolean>(resolve => {
      loginState.value = 'LOADING'
      gtagEvent('bot/loginOffline', {}, false)
      ws.send({ cmd: 'bot/loginOffline', data: null })
      ws.once('bot/loginOffline', () => {
        console.log('login offline success')
        loginState.value = 'LOGIN'
        info.value = { id: 'offline', username: '离线模式', avatar: '' }
        // channel 处理
        const channelStore = useChannelStore()
        channelStore.listenToOffline()
        resolve(true)
      })
    })
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

  return { tab, platform, formModel, loginState, connect, info, isAutoLoginLoading, tryAutoLogin, connectOffline }
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
