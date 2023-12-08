import { BasePtDiceRoll } from '../../index'
import { at } from '../../utils'
import { ICard } from '../../../../../interface/card/types'

export class NnClearDiceRoll extends BasePtDiceRoll {

  roll() {
    return this
  }

  get output(): string {
    return `${at(this.context.userId)}已取消关联人物卡`
  }

  applyToCard(): ICard[] {
    if (this.selfCard) {
      this.context.linkCard(this.selfCard.name, undefined)
    }
    return []
  }
}
