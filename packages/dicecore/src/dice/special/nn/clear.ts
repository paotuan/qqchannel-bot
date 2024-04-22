import type { ICard } from '@paotuan/card'
import { BasePtDiceRoll } from '../../base'

export class NnClearDiceRoll extends BasePtDiceRoll {

  private originCardName?: string

  private get hasLinkPermission() {
    return this.hasPermission(this.config.specialDice.nnDice.writable)
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
      this.linkCard(this.selfCard.name, undefined)
    }
    return []
  }
}
