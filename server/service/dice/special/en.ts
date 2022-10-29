// en list / enl 列出
// en // all
// en aa [tempvalue]

import { BasePtDiceRoll } from '../index'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'

interface IGrowthDecideResult {
  firstRoll: DiceRoll // 首次 d% 结果
  targetValue: number // 技能目标值
  canGrowth: boolean // 是否能成长
  secondRoll?: DiceRoll // 二次 d10 结果
}

export class EnDiceRoll extends BasePtDiceRoll {

  private listMode = false
  private enSkillNames: string[] = []
  private tempValue = NaN
  // 先 d100 判断是否能成长，再 0/d10
  private readonly skill2Growth: Record<string, IGrowthDecideResult> = {}

  get allSkillsCanEn() {
    const cardData = this.context.card?.data
    return cardData ? Object.keys(cardData.meta.skillGrowth).filter(name => cardData.meta.skillGrowth[name]) : [] // 过滤掉值为 false 的
  }

  override roll(): this {
    const parsedExpression = this.parseTemplate()
    const removeEn = parsedExpression.slice(2).trim()
    this.parseMain(removeEn)
    this.realRoll()
    return this
  }

  private parseMain(expression: string) {
    if (expression === 'list' || expression === 'l') {
      this.listMode = true
    } else if (!expression) {
      this.enSkillNames = this.allSkillsCanEn
    } else {
      // 根据第一个空格或数字区分技能名和后续的分界线
      const index = expression.search(/[\s\d]/)
      if (index < 0) {
        this.enSkillNames = [expression]
      } else {
        this.enSkillNames = [expression.slice(0, index)]
        this.tempValue = parseInt(expression.slice(index), 10)
      }
    }
  }

  private realRoll() {
    if (this.listMode) return
    this.enSkillNames.forEach(skill => {
      const entry = this.get(skill, this.tempValue)
      if (!entry) return // 没有人物卡，也没有临时值，就忽略
      const firstRoll = new DiceRoll('d%')
      const canGrowth = firstRoll.total > Math.min(95, entry.baseValue) // 大于技能数值才能增长
      this.skill2Growth[skill] = {
        firstRoll,
        canGrowth,
        targetValue: entry.baseValue,
        secondRoll: canGrowth ? new DiceRoll('d10') : undefined
      }
    })
  }

  override get output() {
    // 列出技能模式
    if (this.listMode) {
      if (this.allSkillsCanEn.length > 0) {
        return `${this.context.username} 当前可成长的技能：\n${this.allSkillsCanEn.join('、')}`
      } else {
        return `${this.context.username} 当前暂无可成长的技能`
      }
    }
    // 成长模式
    const skillsActualGrowth = Object.keys(this.skill2Growth)
    if (skillsActualGrowth.length === 0) {
      return `${this.context.username} 当前无法技能成长`
    } else {
      const lines = [`${this.context.username} 🎲 技能成长：`]
      skillsActualGrowth.forEach(skill => {
        const result = this.skill2Growth[skill]
        const firstTotal = result.firstRoll.total
        const firstDesc = result.canGrowth ? (firstTotal > 95 ? '成功' : `> ${result.targetValue} 成功`) : `≤ ${result.targetValue} 失败`
        lines.push(`🎲 ${skill} d% = ${firstTotal} ${firstDesc}`)
        if (result.canGrowth) {
          lines.push(`🎲 ${skill}成长 d10 = ${result.secondRoll!.total}`)
        }
      })
      return lines.join('\n')
    }
  }

  override applyToCard(): boolean {
    const card = this.context.card
    if (!card) return false
    let updated = false
    Object.keys(this.skill2Growth).forEach(skill => {
      const entry = this.get(skill)
      if (!entry) return // 没有 entry，说明可能用的是临时值
      // 成长
      const growthResult = this.skill2Growth[skill]
      if (growthResult.canGrowth) {
        if (card.setEntry(skill, entry.baseValue + growthResult.secondRoll!.total)) {
          updated = true
        }
      }
      // 取消标记
      if (card.cancelSkillGrowth(skill)) {
        updated = true
      }
    })
    return updated
  }
}
