import type { IDiceRollContext } from '../../utils/parseTemplate'
import { PcCreateDiceRoll } from './create'
import { PcDelDiceRoll } from './del'

const PC_NEW = /^pc\s*new/
const PC_DEL = /^pc\s*del/

export function dispatchPc(expression: string, context: IDiceRollContext, inlineRolls: any[] = []) {
  if (expression.match(PC_NEW)) {
    return new PcCreateDiceRoll(expression, context, inlineRolls)
  } else if (expression.match(PC_DEL)) {
    return new PcDelDiceRoll(expression, context, inlineRolls)
  } else {
    return undefined
  }
}
