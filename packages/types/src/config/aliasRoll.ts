import { IPluginElementCommonInfo } from './utils'

// 指令别名 scope 分为两种：
// - expression: 表达式别名，作用在解析骰子表达式时
// - command: 作用在解析整个指令时
type AliasRollNaiveTrigger = { scope: 'expression', trigger: 'naive', replacer: string } // {{X=1}} => (?<X>\d*) => replacer: {{X}}
type AliasRollRegexTrigger = { scope: 'expression', trigger: 'regex', replacer: ((matchResult: RegExpMatchArray) => string) }
type AliasCommandTrigger = { scope: 'command', trigger: 'startWith' | 'regex', replacer: string | ((matchResult: RegExpMatchArray) => string) }
export type IAliasRollConfig = IPluginElementCommonInfo & {
  command: string // 触发指令
} & (AliasRollNaiveTrigger | AliasRollRegexTrigger | AliasCommandTrigger)
// endregion

// region 自定义房规
export type SuccessLevel = '大失败' | '失败' | '成功' | '困难成功' | '极难成功' | '大成功'

interface IRollDeciderRule {
  level: SuccessLevel
  expression: string
}

export interface IRollDeciderConfig extends IPluginElementCommonInfo {
  rules: IRollDeciderRule[]
}
