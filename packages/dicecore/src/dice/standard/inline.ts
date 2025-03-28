import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { StandardDiceRoll } from './index'

export class InlineDiceRoll extends StandardDiceRoll {
  private diceRoll: DiceRoll | undefined = undefined

  override doRoll() {
    // inline roll 只取第一个，不考虑其他花里胡哨的因素
    this.diceRoll = new DiceRoll(this.expression)
  }

  get total() {
    return this.diceRoll!.total
  }

  override get output() {
    const roll = this.diceRoll!
    // inline roll 通常只用于中间结果，不参与检定，只回显 description
    return `${this.description.trim()} ${this.t(this.quiet ? 'roll.result.quiet' : 'roll.result', this.getFormatArgs(roll))}`.trim()
  }

  override applyToCard() {
    return []
  }
}
