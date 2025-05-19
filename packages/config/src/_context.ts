// 和平台有关的配置，暂且先放在这里吧，没有特别好的做法

export type Platform = 'qqguild' | 'kook' | 'qq' | 'discord' | 'satori' | 'onebot' | 'offline' // 尽量和 satori 保持一致，便于操作
export type BotId = `${Platform}:${string}`

export interface BotContext {
  botId: BotId
  msgId?: string
  platform: Platform
  guildId: string
  channelId: string
  replyMsgId?: string
  isDirect: boolean
  realUser: {
    userId: string
    username: string
  }
}

export interface WebAppContext {
  // todo
}
