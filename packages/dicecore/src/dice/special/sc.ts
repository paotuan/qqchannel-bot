import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import type { ICardEntry } from '@paotuan/card'
import { BasePtDiceRoll } from '../base'
import { removeTrailingOneSpace } from '../utils'
import { parseDescriptions2 } from '../utils/parseDescription'
import type { IRollDecideResult } from '../../config/helpers/decider'

const SC_CARD_ENTRY_NAME = 'SAN' // sc 在人物卡中的字段名

export class ScDiceRoll extends BasePtDiceRoll {
  private noModify = false
  private expression1 = ''
  private expression2 = ''
  private description = ''
  private tempValue = NaN
  private modifiedValue = NaN

  private scEntry?: ICardEntry // 是否人物卡有 sc 项 / 有临时值，可以骰 sc
  private rollSc?: DiceRoll
  private rollScResult?: IRollDecideResult
  private rollLoss?: DiceRoll

  // 记录变化前后值，用于展示. 负值代表不可用（无人物卡等情况）
  private oldSan = -1
  private newSan = -1

  private get scLoss() {
    const roll = this.rollLoss
    if (!roll) return 0
    // 当结果可能为正时（例如 1d10-2），认为目的是扣除理智。此时若结果为负数则变为 0
    // 当结果始终 ≤ 0 时，认为目的是利用 sc 补理智。此时若结果为负数则不处理
    if (roll.maxTotal > 0) {
      return Math.max(roll.total, 0)
    } else {
      return roll.total
    }
  }

  // 检定目标值
  private get scTargetValue() {
    if (!this.scEntry) return undefined
    return this.scEntry.value + (this.modifiedValue || 0)
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
    if (!isNaN(this.tempValue)) {
      this.scEntry = { input: SC_CARD_ENTRY_NAME, key: SC_CARD_ENTRY_NAME, value: this.tempValue, isTemp: true }
    } else {
      this.scEntry = this.selfCard?.getEntry(SC_CARD_ENTRY_NAME)
    }
    if (this.scEntry) {
      this.rollScResult = this.decide({ baseValue: this.scEntry.value, targetValue: this.scTargetValue!, roll: this.rollSc.total })
      if (this.rollScResult) {
        if (this.rollScResult.level === '大失败') {
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

    const { exp, skills } = parseDescriptions2(exp2andDesc)
    // 如果有人在 sc 的时候使用组合技能检定，也只关心第一个
    const { skill: desc = '', tempValue = NaN, modifiedValue = NaN } = skills[0] || {}
    this.expression2 = exp
    this.expression1 ||= exp // 没有 / 的时候就认为 exp1=exp2 吧
    this.description = desc
    this.tempValue = tempValue
    this.modifiedValue = modifiedValue
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
    const firstArgs = this.getFormatArgs(this.rollSc!, this.description, this.scTargetValue)
    const firstStart = this.t('roll.start', firstArgs)
    const firstResult = this.t('roll.result.quiet', firstArgs)
    const firstTest = this.rollScResult ? this.ts(this.rollScResult.level, firstArgs) : this.t('roll.sc.unsupported', firstArgs)
    let line = `${removeTrailingOneSpace(firstStart)} ${firstResult}${firstTest}`
    if (!this.rollScResult) return line // 没有人物卡
    const secondArgs = this.getFormatArgs(this.rollLoss!, '理智损失')
    const secondStart = this.t('roll.start', secondArgs)
    const secondResult = this.t('roll.result', secondArgs)
    line += `\n${secondStart} ${secondResult}`
    // 如果发生了真实的损失，则加入附加语
    if (this.oldSan >= 0) {
      const extra = this.t('roll.sc.extra', this.getFormatArgs(this.rollLoss!))
      line += extra
    }
    return line
  }

  private getFormatArgs(roll: DiceRoll, skill?: string, targetValue?: number) {
    return {
      原始指令: this.rawExpression,
      描述: skill,
      目标值: targetValue,
      掷骰结果: roll.total,
      掷骰表达式: roll.notation,
      掷骰输出: roll.output,
      旧值: this.oldSan,
      新值: this.newSan,
      损失值: this.scLoss,
      sc: true,
      coc: true
    }
  }

  override applyToCard() {
    // 没有成功进行 sc 检定
    if (!this.scEntry) return []
    // 计算 oldSan 和 newSan，以供文案输出
    this.oldSan = this.scEntry.value
    this.newSan = Math.max(0, this.oldSan - this.scLoss)
    if (this.scEntry.isTemp || this.noModify) {
      return [] // 指定了临时值或指定不改变人物卡
    } else {
      // apply 到人物卡
      const card = this.selfCard!
      const updated = card.setEntry(SC_CARD_ENTRY_NAME, this.newSan)
      this.newSan = card.getEntry(SC_CARD_ENTRY_NAME)!.value // set 过程可能有 clamp（不使用 coc 人物卡的极端情况？），保险起见再取一次真实值
      return updated? [card] : []
    }
  }
}
