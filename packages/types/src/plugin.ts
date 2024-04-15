import type { CardType, ICard } from '@paotuan/card'
import type { ICustomReplyEnv, IUserCommand, Platform, IChannelConfig } from '@paotuan/config'

export interface ICardQuery {
  name?: string
  type?: CardType[]
  isTemplate?: boolean
}

type SendMessageOptions = {
  msgType?: 'text' | 'image'
  skipParse?: boolean
}

export interface IPluginRegisterContext {
  versionName: string
  versionCode: number
  roll: (exp: string) => unknown
  render: (template: string, view: any, partials?: any) => string
  getCard: (env: ICustomReplyEnv) => ICard | undefined
  saveCard: (card: ICard) => void
  getLinkedCardUserList: (env: ICustomReplyEnv) => string[] // 获取当前频道关联了人物卡的 user id 列表
  linkCard: (env: ICustomReplyEnv, cardName?: string) => void
  queryCard: (query: ICardQuery) => ICard[]
  sendMessageToChannel: (env: ICustomReplyEnv, msg: string, options?: SendMessageOptions) => Promise<unknown>
  sendMessageToUser: (env: ICustomReplyEnv, msg: string, options?: SendMessageOptions) => Promise<unknown>
  getConfig: (context: { platform: Platform, guildId: string, channelId: string }) => IChannelConfig
  getPreference: (context: { platform: Platform, guildId: string, channelId: string }) => Record<string, string>
  dispatchUserCommand: (context: IUserCommand) => Promise<void>
  _: any // lodash
  _context: any // 逃生通道，通常不要使用
}
