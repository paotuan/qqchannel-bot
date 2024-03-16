export type Platform = 'qqguild' | 'kook' // 尽量和 satori 保持一致，便于操作

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
}

export type IBotConfig = IBotConfig_QQ | IBotConfig_Kook
