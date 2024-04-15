import type { IPluginElementCommonInfo } from './utils'

export type SuccessLevel = '大失败' | '失败' | '成功' | '困难成功' | '极难成功' | '大成功'

interface IRollDeciderRule {
  level: SuccessLevel
  expression: string
}

export interface IRollDeciderConfig extends IPluginElementCommonInfo {
  rules: IRollDeciderRule[]
}
