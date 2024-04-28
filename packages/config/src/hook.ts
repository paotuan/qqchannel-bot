import type { ICardEntryChangeEvent } from '@paotuan/card'
import type { BotId, Platform, UserRole, IPluginElementCommonInfo } from './utils'

export interface IUserCommandContext {
  /**
   * @deprecated
   */
  botId: BotId
  userId: string
  username: string
  userRole: UserRole
  /**
   * @deprecated
   */
  msgId?: string
  /**
   * @deprecated
   */
  platform: Platform
  /**
   * @deprecated
   */
  guildId: string
  /**
   * @deprecated
   */
  channelId: string
  channelUnionId: string
  /**
   * @deprecated
   */
  replyMsgId?: string
  /**
   * @deprecated
   */
  isDirect: boolean
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
  [key: string | number | symbol]: unknown
}

// 标识指令来源，目前仅包含 message_template, 用于区分自定义回复/文案的格式化与骰子指令，目前仅供插件使用
// 后续如有其他需要区分出具体指令的类型，可再加枚举区分
export type CommandSource = 'message_template'

// todo 是否可以和上面合并
export type DiceCommand = {
  command: string,
  context: {
    /**
     * @deprecated
     */
    channelId?: string // 可能是私信？
    channelUnionId: string
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

export interface IHookFunction<T> extends IPluginElementCommonInfo {
  handler: T
}

export type OnReceiveCommandCallback = (result: IUserCommand) => boolean | Promise<boolean>
export type BeforeParseDiceRollCallback = (diceCommand: DiceCommand) => boolean
export type OnCardEntryChangeCallback = (change: CardEntryChange) => void
export type OnMessageReactionCallback = (reaction: MessageReaction) => boolean | Promise<boolean>
export type BeforeDiceRollCallback = (roll: unknown) => boolean // todo roll 类型先不确定
export type AfterDiceRollCallback = (roll: unknown) => void

export interface IHookFunctionConfig {
  onReceiveCommand?: IHookFunction<OnReceiveCommandCallback>[]
  beforeParseDiceRoll?: IHookFunction<BeforeParseDiceRollCallback>[]
  onCardEntryChange?: IHookFunction<OnCardEntryChangeCallback>[]
  onMessageReaction?: IHookFunction<OnMessageReactionCallback>[]
  beforeDiceRoll?: IHookFunction<BeforeDiceRollCallback>[]
  afterDiceRoll?: IHookFunction<AfterDiceRollCallback>[]
}
