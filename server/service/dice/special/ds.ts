import { BasePtDiceRoll } from '../index'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { DndCard } from '../../../../interface/card/dnd'

// 死亡豁免
// 任何人都可以 roll，但是只有关联了 DND 人物卡才进行 applyToCard
export class DsDiceRoll extends BasePtDiceRoll {

  private diceRoll = new DiceRoll('d20')
  private isBest = this.diceRoll.total === 20
  private isWorst = this.diceRoll.total === 1
  private isSuccess = this.diceRoll.total >= 10

  override roll(): this {
    // 不受任何参数影响，初始化时直接 roll 了
    return this
  }

  private get decideResult() {
    if (this.isBest) {
      return '起死回生，HP+1'
    } else if (this.isWorst) {
      return '二次失败'
    } else if (this.isSuccess) {
      return '≥ 10 成功'
    } else {
      return '＜ 10 失败'
    }
  }

  override get output() {
    return `${this.context.username} 🎲 死亡豁免 ${this.diceRoll.output} ${this.decideResult}`
  }

  override applyToCard() {
    // 人物卡类型是否支持
    if (!(this.selfCard instanceof DndCard)) {
      return []
    }
    const card = this.selfCard
    if (this.isBest) {
      card.HP += 1
      card.data.meta.deathSaving.success = 0
      card.data.meta.deathSaving.failure = 0
    } else if (this.isWorst) {
      card.data.meta.deathSaving.failure += 2
    } else if (this.isSuccess) {
      card.data.meta.deathSaving.success++
    } else {
      card.data.meta.deathSaving.failure++
    }
    return [card]
  }
}
