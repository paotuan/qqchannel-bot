import type { ICardEntryChangeEvent } from '../card/types'
import type { Platform } from '../platform/login'
import { BotId } from '../../server/adapter/utils'

export type UserRole = 'admin' | 'manager' | 'user'

export interface IUserCommandContext {
  botId: BotId
  userId: string
  username: string
  userRole: UserRole
  msgId: string
  platform: Platform
  guildId: string
  channelId: string
  replyMsgId?: string
  realUser: {
    userId: string
    username: string
  }
}

export interface IUserCommand {
  command: string
  context: IUserCommandContext
  session?: unknown // we dont care about what it actually is, just pass down
  // 给插件使用，可附加自定义信息
  // [key: string | number | symbol]: unknown
}

// 标识指令来源，目前仅包含 message_template, 用于区分自定义回复/文案的格式化与骰子指令，目前仅供插件使用
// 后续如有其他需要区分出具体指令的类型，可再加枚举区分
export type CommandSource = 'message_template'

// todo 是否可以和上面合并
export type DiceCommand = {
  command: string,
  context: {
    channelId?: string // 可能是私信？
    userId: string
    username: string
    userRole: UserRole
  }
  source?: CommandSource
  // 给插件使用，可附加自定义信息
  [key: string | number | symbol]: unknown
}

export type CardEntryChange = {
  event: ICardEntryChangeEvent
  context: IUserCommandContext
}

export type MessageReaction = { context: IUserCommandContext }

// 各个插件的 item 的通用字段
export interface IPluginElementCommonInfo {
  id: string // 短 id
  name: string
  description?: string
  defaultEnabled?: boolean
}
