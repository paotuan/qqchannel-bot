export type UserRole = 'admin' | 'manager' | 'user'

export interface IUserCommandContext {
  botId: string
  userId: string
  username: string
  userRole: UserRole
  msgId: string
  guildId: string
  channelId: string
  replyMsgId?: string
  realUser: {
    userId: string
    username: string
  }
}

export type ParseUserCommandResult = {
  command: string,
  context: IUserCommandContext
  // 给插件使用，可附加自定义信息
  [key: string | number | symbol]: unknown
}

export interface IPluginElementCommonInfo {
  id: string // 短 id
  name: string
  description?: string
  defaultEnabled?: boolean
}
