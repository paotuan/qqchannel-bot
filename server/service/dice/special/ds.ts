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
  private toStable = false // 是否伤势转为稳定
  private toDeath = false // 是否死亡

  override roll(): this {
    // 不受任何参数影响，初始化时直接 roll 了
    return this
  }

  private get formatArgs() {
    return {
      原始指令: this.rawExpression,
      描述: '死亡豁免',
      目标值: 10,
      掷骰结果: this.diceRoll.total,
      掷骰表达式: this.diceRoll.notation,
      掷骰输出: this.diceRoll.output,
      ds: true, // 以防万一特殊场景使用
      dnd: true
    }
  }

  private get decideResult() {
    if (this.isBest) {
      return this.t('roll.ds.best', this.formatArgs)
    } else if (this.isWorst) {
      return this.t('roll.ds.worst', this.formatArgs)
    } else if (this.isSuccess) {
      return this.ts('成功', this.formatArgs)
    } else {
      return this.ts('失败', this.formatArgs)
    }
  }

  override get output() {
    const headLine = this.t('roll.start', this.formatArgs)
    const output = this.t('roll.result', this.formatArgs)
    const firstLine = `${headLine} ${output}${this.decideResult}`
    if (this.toStable) {
      return firstLine + this.t('roll.ds.tostable', this.formatArgs)
    } else if (this.toDeath) {
      return firstLine + this.t('roll.ds.todeath', this.formatArgs)
    } else {
      return firstLine
    }
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
    if (card.data.meta.deathSaving.success >= 3) {
      this.toStable = true
      // 伤势稳定重置次数
      card.data.meta.deathSaving.success = 0
      card.data.meta.deathSaving.failure = 0
    } else if (card.data.meta.deathSaving.failure >= 3) {
      this.toDeath = true
    }
    return [card]
  }
}
