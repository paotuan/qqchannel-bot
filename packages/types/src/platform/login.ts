export interface IBotConfig_QQ {
  platform: 'qqguild' | 'qq'
  appid: string
  secret: string
  token: string
  sandbox?: boolean
  type?: 'public' | 'private'
}

export interface IBotConfig_Kook {
  platform: 'kook'
  appid: string
  token: string
}

export interface IBotConfig_Satori {
  platform: 'satori'
  appid: string
  endpoint: string
  token?: string
}

export interface IBotConfig_OneBot {
  platform: 'onebot'
  protocol: 'ws'
  appid: string
  endpoint: string
  token?: string
}

export type IBotConfig = IBotConfig_QQ | IBotConfig_Kook | IBotConfig_Satori | IBotConfig_OneBot
