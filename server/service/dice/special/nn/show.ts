import { BasePtDiceRoll } from '../../index'
import { at } from '../../utils'

export class NnShowDiceRoll extends BasePtDiceRoll {

  roll() {
    return this
  }

  get output(): string {
    if (this.selfCard) {
      return `${at(this.context.userId)}当前已关联人物卡：${this.selfCard.name}`
    } else {
      return `${at(this.context.userId)}当前未关联人物卡`
    }
  }
}
