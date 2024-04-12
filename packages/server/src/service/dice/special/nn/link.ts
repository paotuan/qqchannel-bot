import { BasePtDiceRoll } from '../../index'
import type { ICard } from '@paotuan/card'

export class NnLinkDiceRoll extends BasePtDiceRoll {

  // 用户搜索的关键词
  keyword = ''
  // 查询到的卡片列表
  availableCards: ICard[] = []

  // 如果只匹配到唯一一张，就执行关联
  get targetCard() {
    return this.availableCards.length === 1 ? this.availableCards[0] : undefined
  }

  get targetCardName() {
    return this.targetCard?.name
  }

  private get hasLinkPermission() {
    return this.hasPermission(this.context.config.specialDice.nnDice.writable)
  }

  override roll() {
    this.keyword = this.rawExpression.slice(2).trim()
    this.availableCards = this.context.queryCard({ name: this.keyword, isTemplate: false })
    return this
  }

  override get output() {
    if (!this.hasLinkPermission) {
      return this.t('card.nopermission')
    } else if (this.availableCards.length === 0) {
      return this.t('nn.search', { 人物卡列表: [], 关键词: this.keyword })
    } else if (this.targetCardName) {
      return this.t('nn.link', { 人物卡名: this.targetCardName, 关键词: this.keyword })
    } else {
      const availableList = this.availableCards.map((card, i) => ({ 人物卡名: card.name, last: i === this.availableCards.length - 1 }))
      return this.t('nn.search', { 人物卡列表: availableList, 关键词: this.keyword })
    }
  }

  override applyToCard(): ICard[] {
    if (!this.hasLinkPermission) return []
    if (this.availableCards.length === 1) {
      this.context.linkCard(this.targetCardName!, this.context.userId)
    }
    return []
  }
}
