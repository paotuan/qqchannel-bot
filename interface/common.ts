export type Command =
  | 'bot/login'
  | 'bot/info'
  | 'channel/list'
  | 'channel/listen'
  | 'log/push'
  | 'note/send'
  | 'note/sync'
  | 'note/fetch'
  | 'note/delete'
  | 'card/list'
  | 'card/import'
  | 'card/delete'

export interface IMessage<T> {
  cmd: Command
  success?: boolean
  data: T
}

// region bot
export interface ILoginReq {
  appid: string
  token: string
}

export interface IBotInfoResp {
  id: string
  username: string
  avatar: string
  guildId: string
  guildName: string
}
// endregion bot

// region channel
export interface IChannel {
  id: string
  name: string
}

export type IChannelListResp = IChannel[]

export interface IListenToChannelReq {
  channelId: string
}
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
// endregion card
