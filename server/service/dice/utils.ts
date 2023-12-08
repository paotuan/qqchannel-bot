import { StandardDiceRoll } from './standard'
import { ScDiceRoll } from './special/sc'
import { RiDiceRoll, RiListDiceRoll } from './special/ri'
import { CocOpposedDiceRoll } from './standard/cocOppose'
import { getInlineDiceRollKlass, InlineDiceRoll } from './standard/inline'
import { ChannelConfig } from '../config/config'
import type { CustomTextKeys, SuccessLevel, UserRole } from '../../../interface/config'
import type { ICard } from '../../../interface/card/types'
import type { ICardQuery } from '../../../interface/config'
import { GeneralCard } from '../../../interface/card/general'
import { CocDiceRoll } from './standard/coc'
import { DndCard } from '../../../interface/card/dnd'
import { DndDiceRoll } from './standard/dnd'
import { DsDiceRoll } from './special/ds'
import { DndOpposedRoll } from './standard/dndOppose'
import { dispatchEn } from './special/en/utils'
import { dispatchSt } from './special/st/utils'
import { dispatchNn } from './special/nn/utils'

export interface IDiceRollContext {
  channelId?: string
  userId: string
  username: string
  userRole: UserRole
  config: ChannelConfig
  getCard: (userId: string) => ICard | undefined
  linkCard: (cardName: string, userId?: string) => void
  queryCard: (query: ICardQuery) => ICard[]
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
  const getEntry = (key: string) => selfCard?.getEntry(key)?.value ?? ''
  const getAbility = (key: string) => selfCard?.getAbility(key)?.value ?? ''
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

/**
 * 解析表达式，提取出 骰子指令 和 [技能名，临时值]数组（考虑到组合技能检定的情况）
 * @param rawExp 原始输入
 * @param parseExp 是否认为原始输入中包含 骰子指令。false - 用于别名指令的场景，expression 已由别名指定，此处只解析技能名和临时值
 */
export function parseDescriptions2(rawExp: string, parseExp = true) {
  // parse exp & desc
  let exp = '', desc = rawExp.trim()
  if (parseExp) {
    const index = desc.search(/[\p{Unified_Ideograph}\s]/u)
    const [_exp, _desc = ''] = index < 0 ? [desc] : [desc.slice(0, index), desc.slice(index)]
    exp = _exp
    desc = _desc.trim()
  }
  // 如果 desc 完全是数字格式，认为是一个指定了临时值的空技能
  if (desc.match(/^\d+$/)) {
    return { exp, skills: [{ skill: '', tempValue: Number(desc) }]}
  }
  // parse (multi) skills and tempValue from desc
  const regex = /(?<skill>[^0-9\s,，;；]+)\s*((?<tempValue>\d+)|[\s,，;；]*)/g
  const matchResult = [...desc.matchAll(regex)].map(entry => ({ skill: entry.groups!.skill, tempValue: Number(entry.groups!.tempValue) })) // NaN 代表没设
  return { exp, skills: matchResult }
}

/**
 * 工厂方法创建骰子实例
 */
export function createDiceRoll(_expression: string, context: IDiceRollContext) {
  const selfCard = context.getCard(context.userId)
  // 预处理指令（仅在此处处理一次，后续可以改成 hook 插件。不放在 parseTemplate 里面，因为可能会被不同的指令处理器执行多次）
  let expression = context.config.convertCase(_expression)
  expression = context.config.detectCardEntry(expression, selfCard)
  expression = context.config.detectDefaultRollCalculation(expression, selfCard)
  // 根据指令前缀派发
  const specialDiceConfig = context.config.specialDice
  const inlineRolls: InlineDiceRoll[] = []
  if (expression.startsWith('sc') && specialDiceConfig.scDice.enabled) {
    const parsedExpression = parseTemplate(expression, context, inlineRolls)
    return new ScDiceRoll(parsedExpression, context, inlineRolls).roll()
  } else if (expression.startsWith('en') && specialDiceConfig.enDice.enabled) {
    const parsedExpression = parseTemplate(expression, context, inlineRolls)
    return dispatchEn(parsedExpression, context, inlineRolls).roll()
  } else if (expression.startsWith('ri') && specialDiceConfig.riDice.enabled) {
    // ri 由于基数给用户输入，可能包含 attributes，因此统一由内部 parseTemplate
    return new RiDiceRoll(expression, context, inlineRolls).roll()
  } else if (expression.startsWith('init') && specialDiceConfig.riDice.enabled) {
    const parsedExpression = parseTemplate(expression, context, inlineRolls)
    return new RiListDiceRoll(parsedExpression, context, inlineRolls).roll()
  } else if (expression.startsWith('st') && specialDiceConfig.stDice.enabled) {
    // st 也由内部 parseTemplate
    return dispatchSt(expression, context, inlineRolls).roll()
  } else if (['ds', '死亡豁免'].includes(expression) && specialDiceConfig.dsDice.enabled) {
    // 死亡豁免指令简单，无需 parse
    return new DsDiceRoll(expression, context, inlineRolls).roll()
  } else if (expression.startsWith('nn') && specialDiceConfig.nnDice.enabled) {
    // 我寻思 nn 就不用 parseTemplate 了，纯指令不包含掷骰
    return dispatchNn(expression, context, inlineRolls).roll()
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

export function convertSuccessLevel2CustomTextKey(level: SuccessLevel): CustomTextKeys {
  switch (level) {
  case '大失败':
    return 'test.worst'
  case '大成功':
    return 'test.best'
  case '失败':
    return 'test.fail'
  case '极难成功':
    return 'test.exsuccess'
  case '困难成功':
    return 'test.hardsuccess'
  case '成功':
    return 'test.success'
  }
}

// 用于 roll.start 和后面的内容拼接时，如果单行展示，会拼接一个空格
// 但如果此时没有【描述】，则默认又会多一个空格
// 如果直接 trim，自定义文案多打空格都会被删掉，令人迷惑
// 因此检测一下，如果以空格结尾，则只删除一个空格
export function removeTrailingOneSpace(str: string) {
  if (str.endsWith(' ')) {
    return str.slice(0, str.length - 1)
  } else {
    return str
  }
}

// 处理 @ 相关
export const AtUserPattern = /^<@!(\d+)>/
export const AtUserPatternEnd = /<@!(\d+)>$/
export const at = (userId: string) => `<@!${userId}>`
