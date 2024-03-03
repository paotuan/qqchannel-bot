export type Platform = 'qq' | 'kook'

export interface IBotConfig_QQ {
  platform: 'qq'
  appid: string
  secret: string
  token: string
  sandbox?: boolean
  type?: 'public' | 'private'
}

export interface IBotConfig_Kook {
  platform: 'kook'
  appid: string
}

export type IBotConfig = IBotConfig_QQ | IBotConfig_Kook
