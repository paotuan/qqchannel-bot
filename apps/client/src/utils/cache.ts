// 收敛一下对 localStorage 的调用

export type LocalStorageKeys =
  | 'WS_SERVER_ADDR' // server 地址
  | 'WS_SERVER_PORT' // server 端口
  | 'theme' // 主题
  | 'login-platform' // 机器人平台
  | 'login-model' // 机器人凭据
  | `log-${string}` // log
  | 'chat-settings' // ai 设置
  | 'config-filterDiceCommand' // log 面板配置
  | 'config-autoScrollLog'
  | 'card-filter' // 人物卡面板配置
  | 'card-sorter'
  | 'scene-customColumns' // 战斗面板配置
  | 'scene-deleteCharacterOptions'
  | 'qqLastGroupOpenId' // todo 待废弃

export function localStorageSet(key: LocalStorageKeys, value: string) {
  localStorage.setItem(key, value)
}

export function localStorageGet<T>(key: LocalStorageKeys, defaultValue: T) {
  const item = localStorage.getItem(key)
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
