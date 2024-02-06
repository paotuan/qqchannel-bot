import { DiceCommand, IPluginElementCommonInfo, ParseUserCommandResult } from './utils'

export interface IHookFunction<T> extends IPluginElementCommonInfo {
  handler: T
}

export type OnReceiveCommandCallback = (result: ParseUserCommandResult) => boolean | Promise<boolean>
export type BeforeParseDiceRollCallback = (diceCommand: DiceCommand) => boolean

export interface IHookFunctionConfig {
  onReceiveCommand?: IHookFunction<OnReceiveCommandCallback>[]
  beforeParseDiceRoll?: IHookFunction<BeforeParseDiceRollCallback>[]
}
