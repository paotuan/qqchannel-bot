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

// todo 是否可以和上面合并
export type DiceCommand = {
  command: string,
  context: {
    channelId?: string // 可能是私信？
    userId: string
    username: string
    userRole: UserRole
  }
  // 给插件使用，可附加自定义信息
  [key: string | number | symbol]: unknown
}

// 各个插件的 item 的通用字段
export interface IPluginElementCommonInfo {
  id: string // 短 id
  name: string
  description?: string
  defaultEnabled?: boolean
}
