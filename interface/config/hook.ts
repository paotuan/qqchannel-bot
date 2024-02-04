import { IPluginElementCommonInfo, ParseUserCommandResult } from './utils'

interface IHookFunction<T> extends IPluginElementCommonInfo {
  handler: T
}

type OnReceiveCommandCallback = (parsed: ParseUserCommandResult) => void | Promise<void>

export interface IHookFunctionConfig {
  onReceiveCommand?: IHookFunction<OnReceiveCommandCallback>[]
}
