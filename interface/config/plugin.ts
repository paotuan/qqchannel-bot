import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { CardType, ICard } from '../card/types'
import { IMessage } from 'qq-guild-bot'
import { ICustomReplyConfig, ICustomReplyEnv } from './customReply'
import { IAliasRollConfig, IRollDeciderConfig } from './aliasRoll'
import { ICustomTextConfig } from './customText'

export interface ICardQuery {
  name?: string
  type?: CardType[]
  isTemplate?: boolean
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
  sendMessageToChannel: (env: ICustomReplyEnv, msg: string, msgType?: 'text' | 'image') => Promise<IMessage | null>
  sendMessageToUser: (env: ICustomReplyEnv, msg: string, msgType?: 'text' | 'image') => Promise<IMessage | null>
  getPreference: ({ channelId }: { channelId: string }) => Record<string, string>
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
}
