import { BasePtDiceRoll } from '../../index'
import { at } from '../../utils'

export class StShowDiceRoll extends BasePtDiceRoll {

  private readonly shows: string[] = []
  private showSummary = false

  override roll() {
    // 是否有人物卡，如没有直接结束
    if (!this.selfCard) return this
    const exp = this.rawExpression.replace(/^st\s*show/, '').trim()
    this.rollShow(exp)
    return this
  }

  private rollShow(exp: string) {
    const segments = exp.split(/[,，;；、]+/).filter(segment => !!segment.trim())
    if (segments.length > 0) {
      this.shows.push(...segments.map(name => this.selfCard!.getEntryDisplay(name)))
    } else {
      // 不指定展示哪个，就默认展示全部
      this.shows.push(this.selfCard!.getSummary())
      this.showSummary = true
    }
  }

  override get output() {
    if (!this.selfCard) {
      return this.t('card.empty', this.formatArgs)
    }
    // 展示
    return this.t('roll.st.show', {
      ...this.formatArgs,
      条目列表: this.shows.map((条目, i) => ({ 条目, last: i === this.shows.length - 1 })),
      条目唯一: this.shows.length === 1,
      条目: this.shows[0],
      展示全部: this.showSummary
    })
  }

  private get formatArgs() {
    return {
      目标人物卡名: this.selfCard?.name, // 仅用于兼容
      目标用户: at(this.context.userId), // 仅用于兼容
      st: true
    }
  }
}
