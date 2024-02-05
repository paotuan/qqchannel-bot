import { IPluginElementCommonInfo, ParseUserCommandResult } from './utils'

export interface IHookFunction<T> extends IPluginElementCommonInfo {
  handler: T
}

export type OnReceiveCommandCallback = (result: ParseUserCommandResult) => boolean | Promise<boolean>

export interface IHookFunctionConfig {
  onReceiveCommand?: IHookFunction<OnReceiveCommandCallback>[]
}
