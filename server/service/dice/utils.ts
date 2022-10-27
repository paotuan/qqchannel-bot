import type { ICocCardEntry, CocCard } from '../card/coc'
import { StandardDiceRoll } from './standard'
import { ScDiceRoll } from './special/sc'
import { EnDiceRoll } from './special/en'

// 成功等级：大失败，失败，成功，大成功
export type SuccessLevel = -2 | -1 | 1 | 2

// 检定结果
export interface IDeciderResult {
  success: boolean
  level: SuccessLevel
  desc: string
}

// 根据当前 roll 出的值和目标数值，判断成功等级
export type DeciderFunc = (value: number, target: ICocCardEntry) => IDeciderResult

export interface IDiceRollContext {
  // channelId: string
  username: string
  card: CocCard | null
  decide: DeciderFunc
}

// 按第一个中文或空格分割 表达式 和 描述
export function parseDescriptions(expression: string) {
  const index = expression.trim().search(/[\p{Unified_Ideograph}\s]/u)
  const [exp, desc = ''] = index < 0 ? [expression] : [expression.slice(0, index), expression.slice(index)]
  return [exp, desc.trim()]
}

// 工厂方法创建骰子实例
export function createDiceRoll(expression: string, context: IDiceRollContext) {
  if (expression.startsWith('sc')) {
    return new ScDiceRoll(expression, context).roll()
  } else if (expression.startsWith('en')) {
    return new EnDiceRoll(expression, context).roll()
  } else {
    return new StandardDiceRoll(expression, context).roll()
  }
}
