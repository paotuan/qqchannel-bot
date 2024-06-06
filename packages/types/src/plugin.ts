import type { CardType, ICard } from '@paotuan/card'
import type { ICommand, BotContext, Platform, IChannelConfig } from '@paotuan/config'

export interface ICardQuery {
  name?: string
  type?: CardType[]
  isTemplate?: boolean
}

type SendMessageOptions = {
  msgType?: 'text' | 'image'
  skipParse?: boolean
}

type Env = ICommand<BotContext>['context']

export interface IPluginRegisterContext {
  versionName: string
  versionCode: number
  roll: (exp: string) => unknown
  render: (template: string, view: any, partials?: any) => string
  getCard: (env: Env) => ICard | undefined
  saveCard: (card: ICard) => void
  getLinkedCardUserList: (env: Env) => string[] // 获取当前频道关联了人物卡的 user id 列表
  linkCard: (env: Env, cardName?: string) => void
  queryCard: (query: ICardQuery) => ICard[]
  /**
   * @deprecated use {@link sendMessage} instead
   */
  sendMessageToChannel: (env: Env, msg: string, options?: SendMessageOptions) => Promise<unknown>
  /**
   * @deprecated use {@link sendMessage} instead
   */
  sendMessageToUser: (env: Env, msg: string, options?: SendMessageOptions) => Promise<unknown>
  sendMessage: (env: Env, msg: string, options?: SendMessageOptions) => Promise<unknown>
  getConfig: (context: { platform: Platform, guildId: string, channelId: string }) => IChannelConfig
  getPreference: (context: { platform: Platform, guildId: string, channelId: string }) => Record<string, string>
  dispatchUserCommand: (context: ICommand<BotContext>) => Promise<void>
  _: any // lodash
  _context: any // 逃生通道，通常不要使用
}
