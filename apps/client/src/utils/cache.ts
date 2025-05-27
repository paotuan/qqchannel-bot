// 收敛一下对 localStorage 的调用

export type LocalStorageKeys =
  | 'WS_SERVER_ADDR' // server 地址
  | 'WS_SERVER_PORT' // server 端口
  | 'WS_SERVER_SSL' // server 是否使用 ssl
  | 'theme' // 主题
  | 'login-platform' // 机器人平台
  | 'login-model' // 机器人凭据
  | 'login-channel' // 已选子频道
  | `log-${string}` // log
  | 'chat-settings' // ai 设置
  | 'config-filterDiceCommand' // log 面板配置
  | 'config-autoScrollLog'
  | 'card-filter' // 人物卡面板配置
  | 'card-sorter'
  | 'scene-customColumns' // 战斗面板配置
  | 'scene-deleteCharacterOptions'

export function localStorageSet(key: LocalStorageKeys, value: string) {
  localStorage.setItem(key, value)
}

export function localStorageGet<T>(key: LocalStorageKeys, defaultValue: T) {
  const item = localStorage.getItem(key)
  return baseGet(item, defaultValue)
}

export type SessionStorageKeys = 'login-step' // 0 - 未登录，1 - 已登录机器人，2 - 已选择子频道

export function sessionStorageSet(key: SessionStorageKeys, value: string) {
  sessionStorage.setItem(key, value)
}

export function sessionStorageGet<T>(key: SessionStorageKeys, defaultValue: T) {
  const item = sessionStorage.getItem(key)
  return baseGet(item, defaultValue)
}

function baseGet<T>(item: string | null, defaultValue: T) {
  if (!item) return defaultValue
  if (typeof defaultValue === 'string') {
    return item as T
  }
  if (typeof defaultValue === 'number') {
    return Number(item) as T
  }
  if (typeof defaultValue === 'boolean') {
    return Boolean(item) as T
  }
  try {
    return JSON.parse(item) as T
  } catch (e) {
    return defaultValue
  }
}
