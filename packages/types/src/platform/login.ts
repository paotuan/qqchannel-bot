export interface IBotConfig_QQ {
  platform: 'qqguild'
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

export type IBotConfig = IBotConfig_QQ | IBotConfig_Kook
