export type Command =
  | 'bot/login'
  | 'bot/info'
  | 'channel/list'
  | 'channel/listen'

export interface IMessage<T> {
  cmd: Command
  success?: boolean
  data: T
}

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

export interface IChannel {
  id: string
  name: string
}

export type IChannelListResp = IChannel[]

export interface IListenToChannelReq {
  channelId: string
}
