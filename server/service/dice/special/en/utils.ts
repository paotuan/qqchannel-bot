import type { IDiceRollContext } from '../../utils'
import { EnDiceRoll } from './en'
import type { ICard } from '../../../../../interface/card/types'
import { CocCard } from '../../../../../interface/card/coc'
import { EnListDiceRoll } from './list'

const EN_LIST = /^en\s*(l|list)$/

export function dispatchEn(expression: string, context: IDiceRollContext, inlineRolls: any[] = []) {
  if (expression.match(EN_LIST)) {
    return new EnListDiceRoll(expression, context, inlineRolls).roll()
  } else {
    return new EnDiceRoll(expression, context, inlineRolls).roll()
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
