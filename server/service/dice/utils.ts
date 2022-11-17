import type { ICocCardEntry, CocCard } from '../card/coc'
import { StandardDiceRoll } from './standard'
import { ScDiceRoll } from './special/sc'
import { EnDiceRoll } from './special/en'
import { RiDiceRoll, RiListDiceRoll } from './special/ri'
import { OpposedDiceRoll } from './standard/oppose'
import { getInlineDiceRollKlass, InlineDiceRoll } from './standard/inline'

// 成功等级：大失败，失败，成功，困难成功，极难成功，大成功
// export type SuccessLevel = -2 | -1 | 1 | 2
export enum SuccessLevel {
  WORST = -2,
  FAIL = -1,
  REGULAR_SUCCESS = 1,
  HARD_SUCCESS = 2,
  EX_SUCCESS = 3,
  BEST = 4
}

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
  defaultRoll?: string
  card: CocCard | null
  decide: DeciderFunc,
  opposedRoll?: StandardDiceRoll | null
}

/**
 * 解析原始表达式模板，替换 ability, attribute and inline rolls
 */
const ENTRY_REGEX = /\$\{(.*)\}|\$([a-zA-Z\p{Unified_Ideograph}]+)/gu // match ${ any content } or $AnyContent
const INLINE_ROLL_REGEX = /\[\[([^[\]]+)]]/ // match [[ any content ]]
const HISTORY_ROLL_REGEX = /\$(\d+)/g // match $1 $2...
export function parseTemplate(expression: string, context: IDiceRollContext, history: InlineDiceRoll[], depth = 0): string {
  debug(depth, '解析原始表达式:', expression)
  if (depth > 99) throw new Error('stackoverflow in parseTemplate!!')
  const getEntry = (key: string) => context.card?.getEntry(key)?.value || ''
  const getAbility = (key: string) => context.card?.getAbility(key)?.value || ''
  const dbAndBuild = context.card?.dbAndBuild || [] // db 和 体格要特殊处理下，因为是计算属性，不能修改，而且是必有的。todo 思考如何通用
  const InlineDiceRoll = getInlineDiceRollKlass()
  // 1. 如检测到 ability or attribute，则求值并替换
  expression = expression.replace(ENTRY_REGEX, (_, key1?: string, key2?: string) => {
    const key = key1 ?? key2 ?? ''
    // 1.1 是否是 ability？ability 替换为的表达式可能也含有其他的 ability、attribute or inline dice，因此需递归地求值
    const abilityExpression = ['DB', 'db'].includes(key) ? dbAndBuild[0] : getAbility(key)
    if (abilityExpression) {
      debug(depth, '递归解析 ability:', key, '=', abilityExpression)
      const parsedAbility = parseTemplate(abilityExpression, context, history, depth + 1)
      const dice = new InlineDiceRoll(parsedAbility.trim(), context).roll()
      dice.description = key // 将 key 作为 inline dice 的 description，优化 output 展示
      debug(depth, '求值 ability:', dice.total)
      history.push(dice) // 计入 history
      return dice.hidden ? '' : String(dice.total)
    }
    // 1.2 是否是 attribute，如是，则替换为值
    const skillValue = key === '体格' ? dbAndBuild[1] : getEntry(key)
    debug(depth, '解析 attribute:', key, '=', skillValue)
    return String(skillValue ?? '')
  })
  // 2. 如检测到 inline dice，则求值并记录结果
  const thisLevelInlineRolls: InlineDiceRoll[] = [] // 只保存本层的 inline roll 结果，避免 $1 引用到其他层的结果
  //    考虑到 inline dice 嵌套的场景，无限循环来为所有 inline dice 求值
  while (INLINE_ROLL_REGEX.test(expression)) {
    expression = expression.replace(INLINE_ROLL_REGEX, (_, notation: string) => {
      debug(depth, '循环解析 inline:', notation)
      // 注意 inline dice 的 notation 中可能含有 $1，此时需要引用到 thisLevelInlineRolls 的结果
      notation = notation.replace(HISTORY_ROLL_REGEX, (_, index: string) => {
        const historyRoll = thisLevelInlineRolls[Number(index) - 1]
        const result = historyRoll ? String(historyRoll.total) : ''
        debug(depth, `替换 $${index} =`, result)
        return result
      })
      // 理论上 ability 和 attribute 都被替换完了，这里无需再递归解析，可以直接 roll
      const dice = new InlineDiceRoll(notation.trim(), context).roll()
      debug(depth, '求值 inline:', dice.total)
      history.push(dice)
      thisLevelInlineRolls.push(dice) // inline roll 存起来
      // 如果是暗骰则不显示，否则返回值
      return dice.hidden ? '' : String(dice.total)
    })
  }
  // 3. 替换 $1 $2
  expression = expression.replace(HISTORY_ROLL_REGEX, (_, index: string) => {
    const historyRoll = thisLevelInlineRolls[Number(index) - 1]
    const result = historyRoll ? String(historyRoll.total) : ''
    debug(depth, `替换 $${index} =`, result)
    return result
  })
  // 4. finish
  debug(depth, '解析结果:', expression)
  return expression
}

function debug(depth: number, tag: any, ...args: any[]) {
  const indent = new Array(depth).fill('__').join('')
  console.log(indent + tag, ...args)
}

/**
 * 从表达式中提取出 [掷骰表达式|掷骰描述|临时值]
 */
export const ParseFlags = Object.freeze({
  PARSE_EXP: 0b01,
  PARSE_TEMPVALUE: 0b10
})

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

/**
 * 工厂方法创建骰子实例
 */
export function createDiceRoll(expression: string, context: IDiceRollContext) {
  // 1. 通用解析原始表达式
  const inlineRolls: InlineDiceRoll[] = []
  const parsedExpression = parseTemplate(expression, context, inlineRolls)
  // 2. 根据起始指令派发不同类型
  const constructor = (() => {
    if (parsedExpression.startsWith('sc')) {
      return ScDiceRoll
    } else if (parsedExpression.startsWith('en')) {
      return EnDiceRoll
    } else if (parsedExpression.startsWith('ri')) {
      return RiDiceRoll
    } else if (parsedExpression.startsWith('init')) {
      return RiListDiceRoll
    } else {
      if (context.opposedRoll) {
        return OpposedDiceRoll
      } else {
        return StandardDiceRoll
      }
    }
  })()
  // 3. 真正掷骰
  return new constructor(parsedExpression, context, inlineRolls).roll()
}
