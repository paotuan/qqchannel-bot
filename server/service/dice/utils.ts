// 按第一个中文或空格分割 表达式 和 描述
export function parseDescriptions(expression: string) {
  const index = expression.trim().search(/[\p{Unified_Ideograph}\s]/u)
  const [exp, desc = ''] = index < 0 ? [expression] : [expression.slice(0, index), expression.slice(index)]
  return [exp, desc.trim()]
}
