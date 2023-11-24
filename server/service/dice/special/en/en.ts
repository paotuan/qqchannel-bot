// en list / enl 列出
// en // all
// en aa [tempvalue]

import { BasePtDiceRoll } from '../../index'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { CocCard, getCocTempEntry, type ICocCardEntry } from '../../../../../interface/card/coc'
import { getAllSkillsCanEn } from './utils'

interface IGrowthDecideResult {
  firstRoll: DiceRoll // 首次 d% 结果
  targetValue: number // 技能目标值
  canGrowth: boolean // 是否能成长
  secondRoll?: DiceRoll // 二次 d10 结果
  isTemp: boolean // 是否是临时值
}

export class EnDiceRoll extends BasePtDiceRoll {

  private enSkillNames: string[] = []
  private tempValue = NaN
  // 先 d100 判断是否能成长，再 0/d10
  private readonly skill2Growth: Record<string, IGrowthDecideResult> = {}

  override roll() {
    // if (this.isCardUnsupported) return this
    const removeEn = this.rawExpression.slice(2).trim()
    this.parseMain(removeEn)
    this.realRoll()
    return this
  }

  private parseMain(expression: string) {
    if (!expression) {
      this.enSkillNames = getAllSkillsCanEn(this.selfCard)
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
    console.log('[Dice] 成长检定 原始指令', this.rawExpression, '技能', this.enSkillNames.join('|'), '临时值', this.tempValue)
  }

  private realRoll() {
    this.enSkillNames.forEach(skill => {
      let entry: ICocCardEntry | undefined
      if (!isNaN(this.tempValue)) {
        entry = getCocTempEntry(skill, this.tempValue)
      } else if (this.selfCard instanceof CocCard) {
        entry = this.selfCard.getEntry(skill)
      }
      if (!entry) return // 没有人物卡项，也没有临时值，就忽略
      const firstRoll = new DiceRoll('d%')
      const canGrowth = firstRoll.total > Math.min(95, entry.baseValue) // 大于技能数值才能增长
      this.skill2Growth[skill] = {
        firstRoll,
        canGrowth,
        targetValue: entry.baseValue,
        secondRoll: canGrowth ? new DiceRoll('d10') : undefined,
        isTemp: entry.isTemp
      }
    })
  }

  override get output() {
    const skillsActualGrowth = Object.keys(this.skill2Growth)
    if (skillsActualGrowth.length === 0) {
      return this.t('roll.en.empty')
    } else {
      const lines: string[] = []
      skillsActualGrowth.forEach(skill => {
        const result = this.skill2Growth[skill]
        const firstArgs = this.getFormatArgs(skill, result.firstRoll, result.targetValue)
        const firstStart = this.t('roll.start', firstArgs)
        const firstResult = this.t('roll.result.quiet', firstArgs)
        const firstTestResult = result.canGrowth ? (result.firstRoll.total > 95 ? '大成功' : '成功') : '失败'
        const firstTestResultDesc = this.ts(firstTestResult, firstArgs)
        lines.push(`${firstStart} ${firstResult}${firstTestResultDesc}`)
        if (result.canGrowth) {
          const secondArgs = this.getFormatArgs(`${skill}成长`, result.secondRoll!)
          const secondStart = this.t('roll.start', secondArgs)
          const secondResult = this.t('roll.result.quiet', secondArgs)
          lines.push(`${secondStart} ${secondResult}`)
        }
      })
      return lines.join('\n')
    }
  }

  // 技能检定格式化可提供参数
  private getFormatArgs(skill: string, roll: DiceRoll, targetValue?: number) {
    return {
      原始指令: this.rawExpression,
      描述: skill,
      目标值: targetValue,
      掷骰结果: roll.total,
      掷骰表达式: roll.notation,
      掷骰输出: roll.output,
      en: true,
      coc: true
    }
  }

  override applyToCard() {
    const card = this.selfCard
    if (!(card instanceof CocCard)) return []
    let updated = false
    Object.keys(this.skill2Growth).forEach(skill => {
      // 成长
      const growthResult = this.skill2Growth[skill]
      if (growthResult.isTemp) return // 用的是临时值，不修改人物卡
      if (growthResult.canGrowth) {
        if (card.setEntry(skill, growthResult.targetValue + growthResult.secondRoll!.total)) {
          updated = true
        }
      }
      // 取消标记
      if (card.cancelSkillGrowth(skill)) {
        updated = true
      }
    })
    return updated ? [card] : []
  }
}
