export type Command =
  | 'bot/login' // req/res
  | 'bot/info'  // res
  | 'channel/list' // res
  | 'channel/listen' // req
  | 'user/list' // res
  | 'log/push' // res
  | 'note/send' // req/res
  | 'note/sync' // req/res
  | 'note/fetch' // req/res
  | 'note/delete' // req
  | 'card/list' // res
  | 'card/import'
  | 'card/delete'
  | 'card/link'  // req/res
  | 'card/test' // res

export interface IMessage<T> {
  cmd: Command
  success?: boolean
  data: T
}

// region bot
export interface IBotInfo {
  id: string
  username: string
  avatar: string
}

export interface ILoginReq {
  appid: string
  token: string
}

export type IBotInfoResp = IBotInfo
// endregion bot

// region channel
export interface IChannel {
  id: string
  name: string
  guildId: string
  guildName: string
}

export type IChannelListResp = IChannel[]

export interface IListenToChannelReq {
  channelId: string
  guildId: string
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
// endregion channel

// region log
export type MessageType = 'text' | 'image'

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

export interface INoteSendResp {
  note: INote
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
export interface ICard {
  version: number // 1
  basic: {
    name: string
    job: string
    age: number
    gender: string
    hp: number
    san: number
    luck: number
    mp: number
  },
  props: {
    '力量': number
    '体质': number
    '体型': number
    '敏捷': number
    '外貌': number
    '智力': number
    '意志': number
    '教育': number
  },
  skills: { [key: string]: number },
  meta: {
    skillGrowth: { [key: string]: boolean }
  }
}

export interface ICardImportReq {
  card: ICard
}

export type ICardImportResp = ICardImportReq

export type ICardListResp = ICard[]

export interface ICardDeleteReq {
  cardName: string
}

export interface ICardLinkReq {
  cardName: string
  userId: string | null | undefined
}

export type ICardLinkResp = ICardLinkReq

export interface ICardTestResp {
  cardName: string
  propOrSkill: string
  success: boolean
}
// endregion card
