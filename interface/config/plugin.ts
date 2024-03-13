import type { DiceRoll } from '@dice-roller/rpg-dice-roller'
import type { CardType, ICard } from '../card/types'
import type { ICustomReplyConfig, ICustomReplyEnv } from './customReply'
import type { IAliasRollConfig, IRollDeciderConfig } from './aliasRoll'
import type { ICustomTextConfig } from './customText'
import type { IHookFunctionConfig } from './hook'
import type { IUserCommand } from './utils'
import type { IChannelConfig } from './index'
import type { Platform } from '../platform/login'

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
  roll: (exp: string) => DiceRoll
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

export interface IPlugin {
  id: string
  name?: string
  description?: string
  version?: number
  preference?: {
    key: string
    label?: string
    defaultValue?: string
  }[]
  customReply?: ICustomReplyConfig[]
  aliasRoll?: IAliasRollConfig[]
  rollDecider?: IRollDeciderConfig[]
  customText?: ICustomTextConfig[]
  hook?: IHookFunctionConfig
}
