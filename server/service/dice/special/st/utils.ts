import { IDiceRollContext } from '../../utils'
import { StDiceRoll } from './st'
import { StShowDiceRoll } from './show'

const ST_SHOW = /^st\s*show/

export function dispatchSt(expression: string, context: IDiceRollContext, inlineRolls: any[] = []) {
  if (expression.match(ST_SHOW)) {
    return new StShowDiceRoll(expression, context, inlineRolls)
  } else {
    return new StDiceRoll(expression, context, inlineRolls)
  }
}
