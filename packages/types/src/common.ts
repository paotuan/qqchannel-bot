import type { ICardData } from '@paotuan/card'
import type { IRiItem } from '@paotuan/dicecore'
import type { IBotConfig } from './platform'

export type Command =
  | 'bot/loginV2' // req/res
  | 'bot/loginOffline' // req/res
  | 'bot/info'  // req/res
  | 'channel/list' // res
  | 'channel/listen' // req/res
  | 'channel/create' // req/res
  | 'channel/config/default' // req
  | 'channel/config/reset' // req
  | 'log/push' // res
  | 'note/send' // req/res
  | 'note/sendImageRaw' // req/ res: note/send
  | 'note/sync' // req/res
  | 'note/fetch' // req/res
  | 'note/delete' // req
  | 'card/import' // req/res
  | 'card/delete' // req
  | 'plugin/list' // res
  | 'plugin/reload' // req/ res: string
  | 'scene/sendBattleLog' // req/ res: string
  | 'scene/sendMapImage' // req/ res: string
  | 'dice/roll' // req/res
  | 'db/export' // req/res

export interface IMessage<T> {
  cmd: Command
  success?: boolean
  data: T
}

export type MessageType = 'text' | 'image'

// region bot
export interface IBotInfo {
  id: string
  username: string
  avatar: string
}

export type ILoginReqV2 = IBotConfig

export type IBotInfoResp = IBotInfo | null
// endregion bot

// region channel
export interface IChannel {
  id: string
  name: string
  type: number // 0 | 2 | 10005
  guildId: string
  guildName: string
  guildIcon: string
}

export interface IGuild {
  id: string
  name: string
  icon: string
  channels: IChannel[]
}

export type IChannelListResp = IGuild[]

export interface IListenToChannelReq {
  channelId: string
  guildId: string
}

export interface IChannelCreateReq {
  guildId: string
  name: string
}

export interface IUser {
  id: string
  name: string
  avatar: string
  isBot: boolean
  deleted: boolean
}
// endregion channel

// region log
export interface ILog {
  msgId: string
  msgType: MessageType
  userId: string
  username: string
  content: string
  timestamp: string
}

export type ILogPushResp = ILog[]
// endregion log

// region note
export interface INote {
  msgId: string
  msgType: MessageType
  content: string
}

export type INoteSendReq = Omit<INote, 'msgId'>

export interface INoteSendImageRawReq {
  data: string // 本地图片 base64
}

export interface INoteSendResp {
  msgType: MessageType
  note?: INote // 发图片获取不了转存后的地址，所以干脆不传了，直接前端通过 id 获取
  allNoteIds: string[]
}

export interface INoteSyncResp {
  allNoteIds: string[]
}

export type INoteFetchReq = INoteSyncResp
export type INoteFetchResp = INote[]

export interface INoteDeleteReq {
  id: string
}
// endregion note

// region card
export interface ICardImportReq {
  card: ICardData
}

export interface ICardDeleteReq {
  cardName: string
}
// endregion card

// region plugin
interface IPluginItemConfig {
  id: string // 短 id
  name: string
  description: string
  defaultEnabled: boolean
}

export interface IPluginConfigDisplay {
  id: string
  name: string
  description: string
  preference: {
    key: string
    label: string
    defaultValue: string
  }[]
  customReply: IPluginItemConfig[]
  aliasRoll: IPluginItemConfig[]
  rollDecider: IPluginItemConfig[]
  customText: IPluginItemConfig[]
  hook: {
    onReceiveCommand: IPluginItemConfig[]
    beforeParseDiceRoll: IPluginItemConfig[]
    onCardEntryChange: IPluginItemConfig[]
    onMessageReaction: IPluginItemConfig[]
    beforeDiceRoll: IPluginItemConfig[]
    afterDiceRoll: IPluginItemConfig[]
  }
}

export type IPluginReloadReq = string[]
// endregion plugin

// region scene
export interface ISceneSendBattleLogReq {
  content: string
}

export interface ISceneSendMapImageReq {
  data: string
}

export { IRiItem }

// 手动代骰
export interface IDiceRollReq {
  expression: string // 表达式
  cardName: string // 人物卡名称
  userId: string // 人物卡关联的用户 id。若人物卡已关联用户，则优先视为以这个用户代骰。理论上 server 也能通过 cardName 查，不过前端查起来比较方便
  userName: string // 人物卡关联的用户名
}
