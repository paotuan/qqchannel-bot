import type { DiceCommand, IPluginElementCommonInfo, ParseUserCommandResult, CardEntryChange, MessageReaction } from './utils'

export interface IHookFunction<T> extends IPluginElementCommonInfo {
  handler: T
}

export type OnReceiveCommandCallback = (result: ParseUserCommandResult) => boolean | Promise<boolean>
export type BeforeParseDiceRollCallback = (diceCommand: DiceCommand) => boolean
export type OnCardEntryChangeCallback = (change: CardEntryChange) => void
export type OnMessageReactionCallback = (reaction: MessageReaction) => boolean | Promise<boolean>

export interface IHookFunctionConfig {
  onReceiveCommand?: IHookFunction<OnReceiveCommandCallback>[]
  beforeParseDiceRoll?: IHookFunction<BeforeParseDiceRollCallback>[]
  onCardEntryChange?: IHookFunction<OnCardEntryChangeCallback>[]
  onMessageReaction?: IHookFunction<OnMessageReactionCallback>[]
}
