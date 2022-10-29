import type { ICocCardEntry, CocCard } from '../card/coc'
import { StandardDiceRoll } from './standard'
import { ScDiceRoll } from './special/sc'
import { EnDiceRoll } from './special/en'
import { RiDiceRoll, RiListDiceRoll } from './special/ri'

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
  channelId?: string
  username: string
  card: CocCard | null
  decide: DeciderFunc
}

// 按第一个中文或空格分割 表达式 和 描述，按结尾是否有数字分割 描述 和 临时值
export function parseDescriptions(rawExp: string): [string, string, number] {
  rawExp = rawExp.trim()
  const index = rawExp.search(/[\p{Unified_Ideograph}\s]/u)
  // eslint-disable-next-line prefer-const
  let [exp, desc = ''] = index < 0 ? [rawExp] : [rawExp.slice(0, index), rawExp.slice(index)]
  desc = desc.trim()
  const index2 = desc.search(/(\d+)$/)
  const [desc2, tempValue = ''] = index2 < 0 ? [desc] : [desc.slice(0, index2), desc.slice(index2)]
  return [exp, desc2.trim(), parseInt(tempValue, 10)] // tempValue 不存在返回 NaN
}

// 工厂方法创建骰子实例
export function createDiceRoll(expression: string, context: IDiceRollContext) {
  if (expression.startsWith('sc')) {
    return new ScDiceRoll(expression, context).roll()
  } else if (expression.startsWith('en')) {
    return new EnDiceRoll(expression, context).roll()
  } else if (expression.startsWith('ri')) {
    return new RiDiceRoll(expression, context).roll()
  } else if (expression.startsWith('init')) {
    return new RiListDiceRoll(expression, context).roll()
  } else {
    return new StandardDiceRoll(expression, context).roll()
  }
}
