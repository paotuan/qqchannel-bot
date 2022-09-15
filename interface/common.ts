export type Command =
  | 'bot/login'
  | 'bot/info'

export interface IMessage<T> {
  cmd: Command
  success?: boolean
  data: T
}

export interface IService {
  handleMessage(message: IMessage<unknown>): void
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
