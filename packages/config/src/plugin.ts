import type { ICustomReplyConfig } from './customReply'
import type { IAliasRollConfig } from './aliasRoll'
import type { IRollDeciderConfig } from './rollDecider'
import type { ICustomTextConfig } from './customText'
import type { IHookFunctionConfig } from './hook'

export interface IPlugin {
  id: string
  name?: string
  description?: string
  version?: number
  preference?: {
    key: string
    label?: string
    defaultValue?: string
  }[]
  customReply?: ICustomReplyConfig[]
  aliasRoll?: IAliasRollConfig[]
  rollDecider?: IRollDeciderConfig[]
  customText?: ICustomTextConfig[]
  hook?: IHookFunctionConfig
}
