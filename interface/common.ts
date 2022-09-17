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
