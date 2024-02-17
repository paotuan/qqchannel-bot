import type { DiceCommand, IPluginElementCommonInfo, ParseUserCommandResult } from './utils'
import type { ICardEntryChangeEvent } from '../card/types'

export interface IHookFunction<T> extends IPluginElementCommonInfo {
  handler: T
}

export type OnReceiveCommandCallback = (result: ParseUserCommandResult) => boolean | Promise<boolean>
export type BeforeParseDiceRollCallback = (diceCommand: DiceCommand) => boolean
export type OnCardEntryChangeCallback = (event: ICardEntryChangeEvent) => void

export interface IHookFunctionConfig {
  onReceiveCommand?: IHookFunction<OnReceiveCommandCallback>[]
  beforeParseDiceRoll?: IHookFunction<BeforeParseDiceRollCallback>[]
  onCardEntryChange?: IHookFunction<OnCardEntryChangeCallback>[]
}
