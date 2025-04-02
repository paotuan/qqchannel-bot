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
  protocol: 'ws' | 'ws-reverse'
  appid: string
  // 仅 ws，服务端地址
  endpoint?: string
  // 仅 ws，服务端验证 token
  token?: string
  // 仅 ws-reverse, 监听的路径
  path?: string
  // 仅 ws-reverse，监听的端口
  port?: number
}

export type IBotConfig = IBotConfig_QQ | IBotConfig_Kook | IBotConfig_Satori | IBotConfig_OneBot
