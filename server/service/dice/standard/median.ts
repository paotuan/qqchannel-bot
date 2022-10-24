import { StandardDiceRoll } from './index'
import { DeciderFunc } from '../utils'

export class MedianDiceRoll extends StandardDiceRoll {

  override format(username: string, decide?: DeciderFunc) {
    const descriptionStr = this.description ? ' ' + this.description : '' // 避免 description 为空导致连续空格
    const roll = this.rolls[0] // isMedian 多重投骰只取第一个
    const decideResult = decide?.(this.description, roll.total)?.desc || ''
    return `🎲${descriptionStr} ${this.skip ? `${roll.notation} = ${roll.total}` : roll.output} ${decideResult}`
  }
}
