import { BasePtDiceRoll } from '../../index'
import type { ICard } from '@paotuan/card'

export class NnClearDiceRoll extends BasePtDiceRoll {

  private originCardName?: string

  private get hasLinkPermission() {
    return this.hasPermission(this.context.config.specialDice.nnDice.writable)
  }

  roll() {
    this.originCardName = this.selfCard?.name
    return this
  }

  get output(): string {
    if (!this.hasLinkPermission) {
      return this.t('card.nopermission')
    } else {
      return this.t('nn.clear', { 人物卡名: this.originCardName })
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
