import { BasePtDiceRoll } from '../../base'

export class NnShowDiceRoll extends BasePtDiceRoll {

  roll() {
    return this
  }

  get output(): string {
    return this.t('nn.show', { 人物卡名: this.selfCard?.name })
  }
}
