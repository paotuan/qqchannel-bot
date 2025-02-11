import { BasePtDiceRoll } from '../../base'
import type { ICard } from '@paotuan/card'
import { CardProvider } from '../../../card/card-provider'

// pc del 人物卡名
export class PcDelDiceRoll extends BasePtDiceRoll {
  // 想要删除的人物卡查询
  keyword = ''
  // 查询到的卡片列表
  availableCards: ICard[] = []

  override roll() {
    this.keyword = this.rawExpression.replace(/^pc\s*del/, '').trim()
    // 如没有指定 keyword，默认取当前玩家关联的人物卡
    if (!this.keyword) {
      this.keyword = this.selfCard?.name ?? ''
      this.availableCards = this.selfCard ? [this.selfCard] : []
    } else {
      this.availableCards = this.queryCard({ name: this.keyword, isTemplate: false })
      // 如有精确匹配，则只取精确匹配的人物卡
      const keywordLowerCase = this.keyword.toLowerCase()
      const exactCard = this.availableCards.find(card => card.name.toLowerCase() === keywordLowerCase)
      if (exactCard) {
        this.availableCards = [exactCard]
      }
    }
    return this
  }

  // 是否有操作人物卡权限
  private get hasPcPermission() {
    return this.hasPermission(this.config.specialDice.pcDice.writable)
  }

  override get output() {
    // 1. 是否有权限
    if (!this.hasPcPermission) {
      return this.t('card.nopermission')
    }
    // 2. 没有指定人物卡，且用户本身也没有关联的人物卡
    if (!this.keyword) {
      return this.t('card.empty')
    }
    // 3. 指定的人物卡不存在
    if (this.availableCards.length === 0) {
      return this.t('card.search', { 人物卡列表: [], 关键词: this.keyword, pcDel: true })
    }
    // 4. 查询到的人物卡有多个
    if (this.availableCards.length > 1) {
      const availableList = this.availableCards.map((card, i) => ({ 人物卡名: card.name, last: i === this.availableCards.length - 1 }))
      return this.t('card.search', { 人物卡列表: availableList, 关键词: this.keyword, pcDel: true })
    }
    // 5. 删除成功
    return this.t('pc.del', { 人物卡名: this.availableCards[0].name })
  }

  override applyToCard(): ICard[] {
    if (!this.hasPcPermission) return []
    if (!this.keyword) return []
    if (this.availableCards.length !== 1) return []
    CardProvider.INSTANCE.unregisterCard(this.availableCards[0].name)
    // 返回值目前无作用
    return []
  }
}
