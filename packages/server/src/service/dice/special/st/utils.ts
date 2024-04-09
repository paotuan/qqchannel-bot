import { IDiceRollContext } from '../../utils'
import { StDiceRoll } from './st'
import { StShowDiceRoll } from './show'
import { StAbilityDiceRoll } from './stAbility'

const ST_SHOW = /^st\s*show/
const ST_SET_ABILITY = /^st\s*&/

export function dispatchSt(expression: string, context: IDiceRollContext, inlineRolls: any[] = []) {
  if (expression.match(ST_SHOW)) {
    return new StShowDiceRoll(expression, context, inlineRolls)
  } else if (expression.match(ST_SET_ABILITY)) {
    return new StAbilityDiceRoll(expression, context, inlineRolls)
  } else {
    return new StDiceRoll(expression, context, inlineRolls)
  }
}
