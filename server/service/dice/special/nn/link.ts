import { BasePtDiceRoll } from '../../index'
import type { ICard } from '../../../../../interface/card/types'
import { at } from '../../utils'

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

  override roll() {
    this.keyword = this.rawExpression.slice(2).trim()
    this.availableCards = this.context.queryCard({ name: this.keyword, isTemplate: false })
    return this
  }

  override get output() {
    if (this.availableCards.length === 0) {
      return `未找到名字包含"${this.keyword}"的人物卡`
    } else if (this.targetCardName) {
      return `${at(this.context.userId)}已关联人物卡：${this.targetCardName}`
    } else {
      const availableList = this.availableCards.map(card => card.name)
      return `${at(this.context.userId)}请选择想要关联的人物卡：\n${availableList.join('\n')}`
    }
  }

  override applyToCard(): ICard[] {
    if (this.availableCards.length === 1) {
      this.context.linkCard(this.targetCardName!, this.context.userId)
    }
    return []
  }
}
