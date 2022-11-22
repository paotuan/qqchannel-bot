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
export interface IAliasRollConfig {
  id: string // 短 id
  name: string
  description?: string
  command: string // 触发指令
  trigger: 'naive' | 'regex' // naive: {{X=1}} => (?<X>\d*) => replacer: {{X}}
  replacer: string | ((matchResult: RegExpMatchArray) => string) // 解析后指令
}
// endregion

// region 自定义房规
export interface IRollDeciderRule {
  expression: string // new Function => boolean
  reply: string // ≤ {{targetValue}} 成功
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
  version: number // 2
  defaultRoll: string // d100/d20/4dF
  customReplyIds: { id: string, enabled: boolean }[] // full id
  aliasRollIds: { id: string, enabled: boolean }[] // full id
  rollDeciderId: string  // full id 单选
  rollDeciderIds: string[] // full id
  embedPlugin: IPluginConfig // id = io.paotuan.embed.[channelId]
  lastModified: number // ms
}
