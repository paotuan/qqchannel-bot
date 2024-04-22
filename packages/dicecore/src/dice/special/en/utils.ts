import { CocCard, type ICard } from '@paotuan/card'
import type { IDiceRollContext } from '../../utils/parseTemplate'
import { EnDiceRoll } from './en'
import { EnListDiceRoll } from './list'
import { EnMarkDiceRoll } from './mark'

const EN_LIST = /^en\s*(l|list)$/
const EN_MARK = /^en\s*(\+|-|x|clear|clr)/

export function dispatchEn(expression: string, context: IDiceRollContext, inlineRolls: any[] = []) {
  if (expression.match(EN_LIST)) {
    return new EnListDiceRoll(expression, context, inlineRolls)
  } else if (expression.match(EN_MARK)) {
    return new EnMarkDiceRoll(expression, context, inlineRolls)
  } else {
    return new EnDiceRoll(expression, context, inlineRolls)
  }
}

export function getAllSkillsCanEn(card?: ICard) {
  if (card instanceof CocCard) {
    const cardData = card.data
    return cardData ? Object.keys(cardData.meta.skillGrowth).filter(name => cardData.meta.skillGrowth[name]) : [] // 过滤掉值为 false 的
  } else {
    return []
  }
}
