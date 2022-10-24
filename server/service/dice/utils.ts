// 根据描述获取对应的数值
export type GetFunc = (key: string) => string | number

// 根据描述和投骰结果，判断成功等级
export type DeciderFunc = (desc: string, value: number) => IDeciderResult | null
export type SuccessLevel = -2 | -1 | 1 | 2 // 大失败，失败，成功，大成功
export interface IDeciderResult {
  success: boolean
  level: SuccessLevel
  desc: string
}

// 按第一个中文或空格分割 表达式 和 描述
export function parseDescriptions(expression: string) {
  const index = expression.trim().search(/[\p{Unified_Ideograph}\s]/u)
  const [exp, desc = ''] = index < 0 ? [expression] : [expression.slice(0, index), expression.slice(index)]
  return [exp, desc.trim()]
}
