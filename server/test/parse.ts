import { IDeciderResult, IDiceRollContext, SuccessLevel } from '../service/dice/utils'
import { getMedianDiceRollKlass, MedianDiceRoll } from '../service/dice/standard/median'
import { ICard } from '../../interface/common'
import { CocCard, ICocCardEntry } from '../service/card/coc'
import { StandardDiceRoll } from '../service/dice/standard'

const card = new CocCard(getCardProto())
const context: IDiceRollContext = {
  channelId: 'abc123',
  username: 'Maca',
  card,
  decide: (value, target) => decideResult(target, value),
}

const ENTRY_REGEX = /\$\{(.*)\}|\$([a-zA-Z\p{Unified_Ideograph}]+)/gu // match ${ any content } or $AnyContent
const INLINE_ROLL_REGEX = /\[\[([^[\]]+)]]/ // match [[ any content ]]
const HISTORY_ROLL_REGEX = /\$(\d+)/g // match $1 $2...
export function parseTemplate(expression: string, context: IDiceRollContext, history: MedianDiceRoll[], depth: number): string {
  debug(depth, '解析：', expression)
  if (depth > 99) throw new Error('stackoverflow!!')
  // expression = expression.trim()
  const getEntry = (key: string) => context.card?.getEntry(key)?.value || ''
  const getAbility = (key: string) => context.card?.getAbility(key)?.value || ''
  const MedianDiceRoll = getMedianDiceRollKlass()
  // 1. 如检测到 ability or attribute，则求值并替换
  expression = expression.replace(ENTRY_REGEX, (_, key1?: string, key2?: string) => {
    const key = key1 ?? key2 ?? ''
    // 1.1 是否是 ability？ability 替换为的表达式可能也含有其他的 ability、attribute or inline dice，因此需递归地求值
    const abilityExpression = getAbility(key)
    if (abilityExpression) {
      debug(depth, '递归 ability', abilityExpression)
      const parsedAbility = parseTemplate(abilityExpression, context, history, depth + 1)
      const dice = new MedianDiceRoll(parsedAbility.trim(), context).roll()
      debug(depth, '求值', dice.total)
      history.push(dice) // 计入 history
      return dice.hidden ? '' : String(dice.total)
    }
    // 1.2 是否是 attribute，如是，则替换为值
    const skillValue = getEntry(key)
    return String(skillValue ?? '')
  })
  // 2. 如检测到 inline dice，则求值并记录结果
  const thisLevelMedianRolls: MedianDiceRoll[] = [] // 只保存本层的 median roll 结果，避免 $1 引用到其他层的结果
  //    考虑到 inline dice 嵌套的场景，无限循环来为所有 inline dice 求值
  while (INLINE_ROLL_REGEX.test(expression)) {
    expression = expression.replace(INLINE_ROLL_REGEX, (_, notation: string) => {
      // 注意 inline dice 的 notation 中可能含有 $1，此时需要引用到 thisLevelMedianRolls 的结果
      notation = notation.replace(HISTORY_ROLL_REGEX, (_, index: string) => {
        const historyRoll = thisLevelMedianRolls[Number(index) - 1]
        return historyRoll ? String(historyRoll.total) : ''
      })
      debug(depth, '循环 inline', notation)
      // 理论上 ability 和 attribute 都被替换完了，这里无需再递归解析，可以直接 roll
      const dice = new MedianDiceRoll(notation.trim(), context).roll()
      debug(depth, '求值', dice.total)
      history.push(dice)
      thisLevelMedianRolls.push(dice) // median roll 存起来
      // 如果是暗骰则不显示，否则返回值
      return dice.hidden ? '' : String(dice.total)
    })
  }
  // 3. 替换 $1 $2
  expression = expression.replace(HISTORY_ROLL_REGEX, (_, index: string) => {
    const historyRoll = thisLevelMedianRolls[Number(index) - 1]
    return historyRoll ? String(historyRoll.total) : ''
  })
  // 4. finish
  return expression
}

function getCardProto(): ICard {
  return {
    version: 2,
    basic: {
      name: '',
      job: '学生',
      age: 24,
      gender: '秀吉',
      hp: 0,
      san: 0,
      luck: 0,
      mp: 0
    },
    props: {
      '力量': 60,
      '体质': 60,
      '体型': 60,
      '敏捷': 60,
      '外貌': 60,
      '智力': 60,
      '意志': 60,
      '教育': 60
    },
    skills: {},
    meta: {
      skillGrowth: {},
      lastModified: Date.now()
    }
  }
}

function decideResult(cardEntry: ICocCardEntry, roll: number): IDeciderResult {
  if (roll === 1) {
    return { success: true, level: SuccessLevel.BEST, desc: '大成功' }
  } else if ((cardEntry.baseValue < 50 && roll > 95) || (cardEntry.baseValue >= 50 && roll === 100)) {
    return { success: false, level: SuccessLevel.WORST, desc: '大失败' }
  } else if (roll <= cardEntry.value) {
    // 此处只计普通成功，如果是对抗检定需要判断成功等级的场合，则做二次计算
    return { success: true, level: SuccessLevel.REGULAR_SUCCESS, desc: `≤ ${cardEntry.value} 成功` }
  } else {
    return { success: false, level: SuccessLevel.FAIL, desc: `> ${cardEntry.value} 失败` }
  }
}

function debug(depth: number, tag: any, ...args: any[]) {
  console.log(indent(depth) + tag, ...args)
}

function indent(i: number) {
  return new Array(i).fill('xx').join('')
}

// [[d10]]d10
//
// const exp = parseTemplate('[[[[d10]]d10]]d10', context, [], 0)
const roll = new StandardDiceRoll('[[d10]]+$1+$1', context).roll()
console.log(roll.output)
