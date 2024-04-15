import type { UserRole, IPluginElementCommonInfo, BotId, Platform } from './utils'

export interface ICustomReplyEnv {
  botId: BotId
  platform: Platform
  guildId: string
  channelId: string
  userId: string
  username: string
  /**
   * @deprecated Use {@link 用户名} instead.
   */
  nick: string
  用户名: string
  人物卡名: string
  /**
   * @deprecated Use {@link at用户} instead.
   */
  at: string
  at用户: string
  userRole: UserRole
  version: string
  realUser: { userId: string, username: string } // 代骰场景提供真实发起人信息
}

type CustomReplyHandler = (env: ICustomReplyEnv, matchGroup: Record<string, string>) => string | Promise<string>

export interface ICustomReplyConfigItem {
  weight: number // 权重
  reply: string | CustomReplyHandler
}

export interface ICustomReplyConfig extends IPluginElementCommonInfo {
  command: string // 触发词
  trigger: 'exact' | 'startWith' | 'include' | 'regex'
  items?: ICustomReplyConfigItem[] // 给 gui 使用
  handler?: CustomReplyHandler // 给插件使用，简化声明
}
