import { BasePtDiceRoll } from '../index'
import { IDeciderResult, parseDescriptions, SuccessLevel } from '../utils'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'

const SC_CARD_ENTRY_NAME = 'san' // sc 在人物卡中的字段名

export class ScDiceRoll extends BasePtDiceRoll {
  private noModify = false
  private expression1 = ''
  private expression2 = ''
  private description = ''
  private tempValue = NaN

  private rollSc?: DiceRoll
  private rollScResult?: IDeciderResult
  private rollLoss?: DiceRoll

  private get scLoss() {
    return this.rollLoss?.total || 0
  }

  // sc1d10/1d100直视伟大的克苏鲁
  // sc! 不修改人物卡
  override roll() {
    this.parse()
    // 1. 理智检定
    this.rollLoss = undefined
    this.rollScResult = undefined
    this.rollSc = new DiceRoll('d%')
    // 2. 理智损失
    const scEntry = this.get(SC_CARD_ENTRY_NAME, this.tempValue)
    if (scEntry) {
      this.rollScResult = this.decide(this.rollSc.total, scEntry)
      if (this.rollScResult.level === SuccessLevel.WORST) {
        this.rollLoss = new DiceRoll('99')
      } else {
        this.rollLoss = new DiceRoll(this.rollScResult.success ? this.expression1 : this.expression2)
      }
    }
    return this
  }

  private parse() {
    const parsedExpression = this.parseTemplate()
    const removeSc = parsedExpression.slice(2).trim()
    const removeFlags = this.parseFlags(removeSc)
    this.parseMain(removeFlags)
    this.detectDefaultRoll()
  }

  private parseFlags(expression: string) {
    if (expression.startsWith('!') || expression.startsWith('！')) {
      this.noModify = true
      return expression.slice(1).trim()
    } else {
      return expression
    }
  }

  private parseMain(expression: string) {
    let exp2andDesc = expression
    const firstSplitIndex = expression.indexOf('/')
    if (firstSplitIndex >= 0) {
      this.expression1 = expression.slice(0, firstSplitIndex).trim()
      exp2andDesc = expression.slice(firstSplitIndex + 1).trim()
    }
    // 没有 / 的时候就认为 exp1=exp2 吧
    const [exp, desc, tempValue] = parseDescriptions(exp2andDesc)
    this.expression2 = exp
    this.expression1 ||= exp
    this.description = desc
    this.tempValue = tempValue
  }

  private detectDefaultRoll(defaultRoll = 'd%') {
    if (this.expression1 === '' || this.expression1 === 'd') {
      this.expression1 = defaultRoll // todo 默认骰
    }
    if (this.expression2 === '' || this.expression2 === 'd') {
      this.expression2 = defaultRoll // todo 默认骰
    }
  }

  override get output() {
    const descriptionStr = this.description ? ' ' + this.description : '' // 避免 description 为空导致连续空格
    const scRollValue = this.rollSc!.total
    const resultDesc = this.rollScResult?.desc ?? '……成功了吗？'
    let line = `${this.context.username} 🎲${descriptionStr} d% = ${scRollValue} ${resultDesc}`
    if (!this.rollScResult) return line // 没有人物卡
    line += `\n${this.context.username} 🎲 理智损失 ${this.rollLoss!.output}`
    return line
  }

  override applyToCard() {
    const card = this.context.card
    if (this.noModify || !card || this.scLoss === 0) return false
    const oldSan = card.getEntry(SC_CARD_ENTRY_NAME)
    if (!oldSan) return false
    const newSan = Math.max(0, oldSan.value - this.scLoss)
    if (this.scLoss < 0) {
      console.warn('[Dice] 您试图通过负数回 san，系统将不会校验 san 值小于 99-克苏鲁神话 的限制')
    }
    return card.setEntry(SC_CARD_ENTRY_NAME, newSan)
  }
}
