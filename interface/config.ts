// region 自定义回复
export interface ICustomReplyConfigItem {
  weight: number // 权重
  reply: string | ((env: Record<string, string>, matchGroup: Record<string, string>) => string)
}

export interface ICustomReplyConfig {
  id: string // 短 id
  name: string
  description?: string
  command: string // 触发词
  trigger: 'exact' | 'startWith' | 'include' | 'regex'
  items: ICustomReplyConfigItem[]
}
// endregion

// region 指令别名
type AliasRollNaiveTrigger = { trigger: 'naive', replacer: string } // {{X=1}} => (?<X>\d*) => replacer: {{X}}
type AliasRollRegexTrigger = { trigger: 'regex', replacer: ((matchResult: RegExpMatchArray) => string) }
export type IAliasRollConfig = {
  id: string // 短 id
  name: string
  description?: string
  command: string // 触发指令
} & (AliasRollNaiveTrigger | AliasRollRegexTrigger)
// endregion

// region 自定义房规
export interface IRollDeciderRule {
  expression: string // new Function => "use strict"; !!boolean
  reply: string
}

export interface IRollDeciderConfig {
  id: string // 短 id
  name: string
  description?: string
  rules: {
    worst: IRollDeciderRule
    best: IRollDeciderRule
    fail: IRollDeciderRule
    success: IRollDeciderRule
  }
}
// endregion

export interface IPluginRegisterContext {
  versionName: string
  versionCode: number
}

export interface IPluginConfig {
  id: string
  name?: string
  version?: number
  customReply?: ICustomReplyConfig[]
  aliasRoll?: IAliasRollConfig[]
  rollDecider?: IRollDeciderConfig[]
}

export interface IChannelConfig {
  version: number // 3
  defaultRoll: string // d100/d20/4dF
  customReplyIds: { id: string, enabled: boolean }[] // full id
  aliasRollIds: { id: string, enabled: boolean }[] // full id
  rollDeciderId: string  // full id 单选
  rollDeciderIds: string[] // full id
  embedPlugin: IPluginConfig // id = io.paotuan.embed.[channelId]
  lastModified: number // ms
}
