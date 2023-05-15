import { StandardDiceRoll } from './standard'
import { ScDiceRoll } from './special/sc'
import { EnDiceRoll } from './special/en'
import { RiDiceRoll, RiListDiceRoll } from './special/ri'
import { CocOpposedDiceRoll } from './standard/cocOppose'
import { getInlineDiceRollKlass, InlineDiceRoll } from './standard/inline'
import { ChannelConfig } from '../config/config'
import { StDiceRoll } from './special/st'
import type { UserRole } from '../../../interface/config'
import type { ICard } from '../../../interface/card/types'
import { GeneralCard } from '../../../interface/card/general'
import { CocDiceRoll } from './standard/coc'
import { DndCard } from '../../../interface/card/dnd'
import { DndDiceRoll } from './standard/dnd'
import { DsDiceRoll } from './special/ds'
import { DndOpposedRoll } from './standard/dndOppose'

// 成功等级：大失败，失败，成功，困难成功，极难成功，大成功
// export type SuccessLevel = -2 | -1 | 1 | 2
export const enum SuccessLevel {
  WORST = -2,
  FAIL = -1,
  REGULAR_SUCCESS = 1,
  HARD_SUCCESS = 2,
  EX_SUCCESS = 3,
  BEST = 4
}

export interface IDiceRollContext {
  channelId?: string
  userId: string
  username: string
  userRole: UserRole
  config: ChannelConfig
  getCard: (userId: string) => ICard | undefined
  opposedRoll?: StandardDiceRoll
}

/**
 * 解析原始表达式模板，替换 ability, attribute and inline rolls
 */
const ENTRY_REGEX = /\$\{(.*?)\}|\$([a-zA-Z\p{Unified_Ideograph}]+)/gu // match ${ any content } or $AnyContent
const INLINE_ROLL_REGEX = /\[\[([^[\]]+)]]/ // match [[ any content ]]
const HISTORY_ROLL_REGEX = /\$(\d+)/g // match $1 $2...
export function parseTemplate(expression: string, context: IDiceRollContext, history: InlineDiceRoll[], depth = 0): string {
  debug(depth, '解析原始表达式:', expression)
  if (depth > 99) throw new Error('stackoverflow in parseTemplate!!')
  const selfCard = context.getCard(context.userId)
  const getEntry = (key: string) => selfCard?.getEntry(key)?.value || ''
  const getAbility = (key: string) => selfCard?.getAbility(key)?.value || ''
  const InlineDiceRoll = getInlineDiceRollKlass()
  // 1. 如检测到 ability or attribute，则求值并替换
  expression = expression.replace(ENTRY_REGEX, (_, key1?: string, key2?: string) => {
    const key = key1 ?? key2 ?? ''
    // 1.1 是否是 ability？ability 替换为的表达式可能也含有其他的 ability、attribute or inline dice，因此需递归地求值
    const abilityExpression = getAbility(key)
    if (abilityExpression) {
      debug(depth, '递归解析 ability:', key, '=', abilityExpression)
      const parsedAbility = parseTemplate(abilityExpression, context, history, depth + 1)
      // 将 key 拼接到表达式后面，这样 key 就会自然地被解析为 description 输出，优化 output 展示
      const dice = new InlineDiceRoll(`${parsedAbility.trim()} ${key}`, context).roll()
      debug(depth, '求值 ability:', dice.total)
      history.push(dice) // 计入 history
      return dice.hidden ? '' : String(dice.total)
    }
    // 1.2 是否是 attribute，如是，则替换为值
    const skillValue = getEntry(key)
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
    const [_exp, _desc = ''] = index < 0 ? [desc] : [desc.slice(0, index), desc.slice(index)]
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

export function parseDescriptions2(rawExp: string) {
  // parse exp & desc
  let exp = '', desc = rawExp.trim()
  const index = desc.search(/[\p{Unified_Ideograph}\s]/u)
  const [_exp, _desc = ''] = index < 0 ? [desc] : [desc.slice(0, index), desc.slice(index)]
  exp = _exp
  desc = _desc.trim()
  // parse (multi) skills and tempValue from desc
  const regex = /(?<skill>[^0-9\s,，;；]+)\s*((?<tempValue>\d+)|[\s,，;；]*)/g
  const matchResult = [...desc.matchAll(regex)].map(entry => ({ skill: entry.groups!.skill, tempValue: Number(entry.groups!.tempValue) })) // NaN 代表没设
  return { exp, skills: matchResult }
}

/**
 * 工厂方法创建骰子实例
 */
export function createDiceRoll(expression: string, context: IDiceRollContext) {
  const specialDiceConfig = context.config.specialDice
  const inlineRolls: InlineDiceRoll[] = []
  const selfCard = context.getCard(context.userId)
  if (expression.startsWith('sc') && specialDiceConfig.scDice.enabled) {
    const parsedExpression = parseTemplate(expression, context, inlineRolls)
    return new ScDiceRoll(parsedExpression, context, inlineRolls).roll()
  } else if (expression.startsWith('en') && specialDiceConfig.enDice.enabled) {
    const parsedExpression = parseTemplate(expression, context, inlineRolls)
    return new EnDiceRoll(parsedExpression, context, inlineRolls).roll()
  } else if (expression.startsWith('ri') && specialDiceConfig.riDice.enabled) {
    // ri 由于基数给用户输入，可能包含 attributes，因此统一由内部 parseTemplate
    return new RiDiceRoll(expression, context, inlineRolls).roll()
  } else if (expression.startsWith('init') && specialDiceConfig.riDice.enabled) {
    const parsedExpression = parseTemplate(expression, context, inlineRolls)
    return new RiListDiceRoll(parsedExpression, context, inlineRolls).roll()
  } else if (expression.startsWith('st') && specialDiceConfig.stDice.enabled) {
    // st 由于可能要读取他人人物卡，也由内部 parseTemplate
    return new StDiceRoll(expression, context, inlineRolls).roll()
  } else if (['ds', '死亡豁免'].includes(expression) && specialDiceConfig.dsDice.enabled) {
    // 死亡豁免指令简单，无需 parse
    return new DsDiceRoll(expression, context, inlineRolls).roll()
  } else {
    const parsedExpression = parseTemplate(expression, context, inlineRolls)
    // 对抗检定判断
    if (context.opposedRoll && specialDiceConfig.opposeDice.enabled) {
      const opposedType = getOpposedType(context.opposedRoll, selfCard)
      if (opposedType === 'coc') {
        return new CocOpposedDiceRoll(parsedExpression, context, inlineRolls).roll()
      } else if (opposedType === 'dnd') {
        return new DndOpposedRoll(parsedExpression, context, inlineRolls).roll()
      }
    }
    // 走普通掷骰逻辑
    if (selfCard instanceof GeneralCard) {
      return new StandardDiceRoll(parsedExpression, context, inlineRolls).roll()
    } else if (selfCard instanceof DndCard) {
      return new DndDiceRoll(parsedExpression, context, inlineRolls).roll()
    } else {
      // 默认情况（包括未关联人物卡）都走 coc 的逻辑吧，和传统一致。后续看是否要引入配置
      return new CocDiceRoll(parsedExpression, context, inlineRolls).roll()
    }
  }
}

// 判断对抗检定的类型
function getOpposedType(opposedRoll: StandardDiceRoll, selfCard?: ICard) {
  // 如果没有 selfCard，则跟随 opposedRoll 的类型
  if (!selfCard) {
    if (opposedRoll instanceof CocDiceRoll) return 'coc'
    if (opposedRoll instanceof DndDiceRoll) return 'dnd'
    return undefined
  }
  // 如果有 selfCard，那么必须和 opposedRoll 是相同的类型才能触发对抗
  if (selfCard.type === 'coc' && opposedRoll instanceof CocDiceRoll) return 'coc'
  if (selfCard.type === 'dnd' && opposedRoll instanceof DndDiceRoll) return 'dnd'
  return undefined
}

// 用户权限 id 适配 理论上不要放在这里
// https://bot.q.qq.com/wiki/develop/nodesdk/model/role.html#DefaultRoleIDs
export function convertRoleIds(ids: string[]): UserRole {
  if (ids.includes('4')) {
    return 'admin'
  } else if (ids.includes('2') || ids.includes('5')) {
    return 'manager'
  } else {
    return 'user'
  }
}
