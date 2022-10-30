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

export const ParseFlags = Object.freeze({
  PARSE_EXP: 0b01,
  PARSE_TEMPVALUE: 0b10
})

// 按第一个中文或空格分割 表达式 和 描述，按结尾是否有数字分割 描述 和 临时值
export function parseDescriptions(rawExp: string, flag = ParseFlags.PARSE_EXP | ParseFlags.PARSE_TEMPVALUE): [string, string, number] {
  let exp = '', desc = rawExp.trim(), tempValue = NaN
  if (flag & ParseFlags.PARSE_EXP) {
    const index = desc.search(/[\p{Unified_Ideograph}\s]/u)
    const [_exp, _desc = ''] = index < 0 ? [rawExp] : [rawExp.slice(0, index), rawExp.slice(index)]
    exp = _exp
    desc = _desc.trim()
  }
  if (flag & ParseFlags.PARSE_TEMPVALUE) {
    const index = desc.search(/(\d+)$/)
    const [_desc, _tempValue = ''] = index < 0 ? [desc] : [desc.slice(0, index), desc.slice(index)]
    desc = _desc.trim()
    tempValue = parseInt(_tempValue, 10) // tempValue 不存在返回 NaN
  }
  return [exp, desc, tempValue]
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
