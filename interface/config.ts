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
  expression: string
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

// region 插件相关
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
// endregion

// 特殊指令配置
export interface ISpecialDiceConfig {
  enDice: { enabled: boolean },
  scDice: { enabled: boolean },
  riDice: { enabled: boolean, baseRoll: string }
  stDice: { enabled: boolean, writable: 'all' | 'none' | 'manager' }
  opposeDice: { enabled: boolean, refineSuccessLevels: boolean }
  inMessageDice: { enabled: boolean }
}

export interface IChannelConfig {
  version: number // 3
  defaultRoll: string // d100/d20/4dF
  specialDice: ISpecialDiceConfig
  customReplyIds: { id: string, enabled: boolean }[] // full id
  aliasRollIds: { id: string, enabled: boolean }[] // full id
  rollDeciderId: string  // full id 单选
  rollDeciderIds: string[] // full id
  embedPlugin: IPluginConfig // id = io.paotuan.embed.xx
  lastModified: number // ms
}
