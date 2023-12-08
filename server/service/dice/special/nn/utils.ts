import type { IDiceRollContext } from '../../utils'
import { NnShowDiceRoll } from './show'
import { NnClearDiceRoll } from './clear'
import { NnLinkDiceRoll } from './link'

const NN_CLEAR = /^nn\s*(x|clear|clr)$/

export function dispatchNn(expression: string, context: IDiceRollContext, inlineRolls: any[] = []) {
  if (expression.match(NN_CLEAR)) {
    return new NnClearDiceRoll(expression, context, inlineRolls)
  } else if (expression === 'nn') {
    return new NnShowDiceRoll(expression, context, inlineRolls)
  } else {
    return new NnLinkDiceRoll(expression, context, inlineRolls)
  }
}
