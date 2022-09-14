export type Command =
  | 'bot/login'
  | 'ooooo'

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
