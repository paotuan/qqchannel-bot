import { DndCard, GeneralCard, ICard } from '@paotuan/card'
import type { ICommand } from '@paotuan/config'
import { parseTemplate } from './parseTemplate'
import { DiceRollEventListenerMap } from '../base'
import { InlineDiceRoll } from '../standard/inline'
import { ScDiceRoll } from '../special/sc'
import { dispatchEn } from '../special/en/utils'
import { RiDiceRoll, RiListDiceRoll } from '../special/ri'
import { dispatchSt } from '../special/st/utils'
import { DsDiceRoll } from '../special/ds'
import { dispatchNn } from '../special/nn/utils'
import { CocOpposedDiceRoll } from '../standard/cocOppose'
import { DndOpposedRoll } from '../standard/dndOppose'
import { StandardDiceRoll } from '../standard'
import { DndDiceRoll } from '../standard/dnd'
import { CocDiceRoll } from '../standard/coc'
import { CardProvider } from '../../card/card-provider'
import { ConfigProvider } from '../../config/config-provider'
import { dispatchPc } from '../special/pc/utils'

/**
 * 工厂方法创建骰子实例
 */
export function createDiceRoll(userCommand: ICommand, opposedRoll?: StandardDiceRoll, listeners: DiceRollEventListenerMap = {}) {
  const { command: expression, context } = userCommand
  const selfCard = CardProvider.INSTANCE.getCard(context.channelUnionId, context.userId)
  const config = ConfigProvider.INSTANCE.getConfig(context.channelUnionId)
  // 根据指令前缀派发
  const specialDiceConfig = config.specialDice
  const inlineRolls: InlineDiceRoll[] = []
  if (expression.startsWith('sc') && specialDiceConfig.scDice.enabled) {
    const parsedExpression = parseTemplate(expression, context, inlineRolls)
    return new ScDiceRoll(parsedExpression, context, inlineRolls).roll()
  } else if (expression.startsWith('en') && specialDiceConfig.enDice.enabled) {
    // en 基本上无需 parseTemplate，除非临时值需要计算，但那也是很少的情况，可用 inline roll 实现
    return dispatchEn(expression, context, inlineRolls).roll()
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
    // pc 无需 parse
    if (specialDiceConfig.pcDice.enabled) {
      const pcRoll = dispatchPc(expression, context, inlineRolls)
      if (pcRoll) {
        return pcRoll.roll()
      }
    }

    // 普通检定/掷骰
    const roller = (() => {
      const parsedExpression = parseTemplate(expression, context, inlineRolls)
      // 对抗检定判断
      if (opposedRoll && specialDiceConfig.opposeDice.enabled) {
        const opposedType = getOpposedType(opposedRoll, selfCard)
        if (opposedType === 'coc') {
          return new CocOpposedDiceRoll(parsedExpression, context, opposedRoll, inlineRolls)
        } else if (opposedType === 'dnd') {
          return new DndOpposedRoll(parsedExpression, context, opposedRoll, inlineRolls)
        }
      }
      // 走普通掷骰逻辑
      if (selfCard instanceof GeneralCard) {
        return new StandardDiceRoll(parsedExpression, context, inlineRolls)
      } else if (selfCard instanceof DndCard) {
        return new DndDiceRoll(parsedExpression, context, inlineRolls)
      } else {
        // 默认情况（包括未关联人物卡）都走 coc 的逻辑吧，和传统一致。后续看是否要引入配置
        return new CocDiceRoll(parsedExpression, context, inlineRolls)
      }
    })()
    // 目前仅普通检定掷骰接入事件机制
    roller.addDiceRollEventListener(listeners)
    roller.roll()
    roller.removeDiceRollEventListener(listeners)
    return roller
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
