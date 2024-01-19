import type { IChannelConfig } from './config'
import type { ICardData } from './card/types'

export type Command =
  | 'bot/login' // req/res
  | 'bot/info'  // res
  | 'channel/list' // res
  | 'channel/listen' // req
  | 'channel/config' // req/res
  | 'channel/config/reset' // req
  | 'user/list' // res
  | 'user/delete' // req
  | 'log/push' // res
  | 'note/send' // req/res
  | 'note/sendImageRaw' // req/ res: note/send
  | 'note/sync' // req/res
  | 'note/fetch' // req/res
  | 'note/delete' // req
  | 'card/list' // res
  | 'card/import' // req/res
  | 'card/delete' // req
  | 'card/link'  // req/res
  | 'card/test' // res
  | 'plugin/list' // res
  | 'scene/sendBattleLog' // req/ res: string
  | 'scene/sendMapImage' // req/ res: string
  | 'ri/list' // res
  | 'ri/set' // req
  | 'ri/delete' // req
  | 'dice/roll' // req/res

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

export interface ILoginReq {
  appid: string
  token: string
  sandbox: boolean
}

export type IBotInfoResp = IBotInfo
// endregion bot

// region channel
export interface IChannel {
  id: string
  name: string
  type: 0 | 2 | 10005
  guildId: string
  guildName: string
  guildIcon: string
}

export type IChannelListResp = IChannel[]

export interface IListenToChannelReq {
  channelId: string
  guildId: string
}

export interface IChannelConfigReq {
  config: IChannelConfig
  setDefault: boolean
}

export interface IChannelConfigResp {
  config: IChannelConfig
}

export interface IUser {
  id: string
  nick: string
  username: string
  avatar: string
  bot: boolean
  deleted: boolean
}

export type IUserListResp = IUser[]

export type IUserDeleteReq = {
  ids: string[]
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

// export type ICardImportResp = ICardImportReq

export type ICardListResp = ICardData[]

export interface ICardDeleteReq {
  cardName: string
}

export interface ICardLinkReq {
  cardName: string
  userId: string | null | undefined
}

export type ICardLinkResp = ICardLinkReq[]

export interface ICardTestResp {
  cardName: string
  propOrSkill: string
  success: boolean
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
  customReply: IPluginItemConfig[]
  aliasRoll: IPluginItemConfig[]
  rollDecider: IPluginItemConfig[]
  customText: IPluginItemConfig[]
}
// endregion plugin

// region scene
export interface ISceneSendBattleLogReq {
  content: string
}

export interface ISceneSendMapImageReq {
  data: string
}

export interface IRiItem {
  type: 'actor' | 'npc'
  id: string
  seq: number
  seq2: number
}

export type IRiListResp = IRiItem[]
export type IRiSetReq = IRiItem
export interface IRiDeleteReq {
  type: 'actor' | 'npc'
  id: string
}

// 手动代骰
export interface IDiceRollReq {
  expression: string
  cardData: ICardData
}
