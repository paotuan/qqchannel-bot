import { BasePtDiceRoll } from '../index'
import { parseDescriptions, SuccessLevel } from '../utils'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import type { IRollDecideResult } from '../../config/helpers/decider'

const SC_CARD_ENTRY_NAME = 'SAN' // sc 在人物卡中的字段名

export class ScDiceRoll extends BasePtDiceRoll {
  private noModify = false
  private expression1 = ''
  private expression2 = ''
  private description = ''
  private tempValue = NaN

  private rollSc?: DiceRoll
  private rollScResult?: IRollDecideResult
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
    // 2. 理智损失. 由于不涉及难度等逻辑，直接使用父类的 ICardEntry 即可
    let scEntry = this.selfCard?.getEntry(SC_CARD_ENTRY_NAME)
    if (!scEntry && !isNaN(this.tempValue)) {
      scEntry = { input: SC_CARD_ENTRY_NAME, key: SC_CARD_ENTRY_NAME, value: this.tempValue, isTemp: true }
    }
    if (scEntry) {
      this.rollSc.total
      this.rollScResult = this.decide({ baseValue: scEntry.value, targetValue: scEntry.value, roll: this.rollSc.total })
      if (this.rollScResult) {
        if (this.rollScResult.level === SuccessLevel.WORST) {
          const maxLoss = new DiceRoll(this.expression2).maxTotal
          this.rollLoss = new DiceRoll(String(maxLoss))
        } else {
          this.rollLoss = new DiceRoll(this.rollScResult.success ? this.expression1 : this.expression2)
        }
      }
    }
    return this
  }

  private parse() {
    const removeSc = this.rawExpression.slice(2).trim()
    const removeFlags = this.parseFlags(removeSc)
    this.parseMain(removeFlags)
    this.detectDefaultRoll()
    console.log('[Dice] 理智检定 原始指令', this.rawExpression, '成功', this.expression1, '失败', this.expression2, '描述', this.description, '临时值', this.tempValue, 'noModify', this.noModify)
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

  private detectDefaultRoll() {
    if (this.expression1 === '' || this.expression1 === 'd') {
      this.expression1 = '0'
    }
    if (this.expression2 === '' || this.expression2 === 'd') {
      this.expression2 = this.defaultRoll
    }
  }

  override get output() {
    const descriptionStr = this.description ? ' ' + this.description : '' // 避免 description 为空导致连续空格
    const scRollValue = this.rollSc!.total
    const resultDesc = this.rollScResult?.desc ?? '……未指定理智值，成功了吗？'
    let line = `${this.context.username} 🎲${descriptionStr} d% = ${scRollValue} ${resultDesc}`
    if (!this.rollScResult) return line // 没有人物卡
    line += `\n${this.context.username} 🎲 理智损失 ${this.rollLoss!.output}`
    return line
  }

  override applyToCard() {
    const card = this.selfCard
    if (this.noModify || !card || this.scLoss === 0) return []
    const oldSan = card.getEntry(SC_CARD_ENTRY_NAME)
    if (!oldSan) return []
    const newSan = Math.max(0, oldSan.value - this.scLoss)
    const updated = card.setEntry(SC_CARD_ENTRY_NAME, newSan)
    return updated? [card] : []
  }
}
