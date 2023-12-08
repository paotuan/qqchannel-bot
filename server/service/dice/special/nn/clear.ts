import { BasePtDiceRoll } from '../../index'
import { at } from '../../utils'
import { ICard } from '../../../../../interface/card/types'

export class NnClearDiceRoll extends BasePtDiceRoll {

  private get hasLinkPermission() {
    return this.hasPermission(this.context.config.specialDice.nnDice.writable)
  }

  roll() {
    return this
  }

  get output(): string {
    if (!this.hasLinkPermission) {
      return `${at(this.context.userId)}没有关联人物卡的权限`
    } else {
      return `${at(this.context.userId)}已取消关联人物卡`
    }
  }

  applyToCard(): ICard[] {
    if (!this.hasLinkPermission) return []
    if (this.selfCard) {
      this.context.linkCard(this.selfCard.name, undefined)
    }
    return []
  }
}
