export type UserRole = 'admin' | 'manager' | 'user'

export interface IMessage {
  userId: string
  username: string
  userRole: UserRole
  msgId: string
  guildId: string
  channelId: string
  replyMsgId?: string
}

export interface ISubstituteUser {
  userId: string
  username: string
}

export type ParseUserCommandResult = {
  command: string,
  message: IMessage,
  substitute?: ISubstituteUser,
  // 给插件使用，可附加自定义信息
  [key: string | number | symbol]: unknown
}

export interface IPluginElementCommonInfo {
  id: string // 短 id
  name: string
  description?: string
  defaultEnabled?: boolean
}
