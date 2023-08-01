// en list / enl 列出
// en // all
// en aa [tempvalue]

import { BasePtDiceRoll } from '../index'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { CocCard, getCocTempEntry } from '../../../../interface/card/coc'

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

  // 如果关联了非 coc 人物卡，就提示不支持（如果无人物卡还是可以通过临时值来使用的）
  // 另外不直接在外面解析前缀的时候拦掉，是为了进来的时候可以有不支持的提示
  private get isCardUnsupported() {
    return this.selfCard && !(this.selfCard instanceof CocCard)
  }

  private get allSkillsCanEn() {
    const cardData = (this.selfCard as CocCard | undefined)?.data
    return cardData ? Object.keys(cardData.meta.skillGrowth).filter(name => cardData.meta.skillGrowth[name]) : [] // 过滤掉值为 false 的
  }

  override roll() {
    if (this.isCardUnsupported) return this
    const removeEn = this.rawExpression.slice(2).trim()
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
    console.log('[Dice] 成长检定 原始指令', this.rawExpression, '列出', this.listMode, '技能', this.enSkillNames.join('|'), '临时值', this.tempValue)
  }

  private realRoll() {
    if (this.listMode) return
    this.enSkillNames.forEach(skill => {
      let entry = (this.selfCard as CocCard | undefined)?.getEntry(skill)
      if (!entry && !isNaN(this.tempValue)) {
        entry = getCocTempEntry(skill, this.tempValue)
      }
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
    // 不支持的人物卡
    if (this.isCardUnsupported) {
      return this.t('roll.en.empty')
    }
    // 列出技能模式
    if (this.listMode) {
      if (this.allSkillsCanEn.length > 0) {
        return this.t('roll.en.list', {
          技能列表: this.allSkillsCanEn.map((技能名, i) => ({ 技能名, last: i === this.allSkillsCanEn.length - 1 })),
          技能唯一: this.allSkillsCanEn.length === 1,
          技能名: this.allSkillsCanEn[0]
        })
      } else {
        return this.t('roll.en.empty')
      }
    }
    // 成长模式
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
      en: true
    }
  }

  override applyToCard() {
    if (this.isCardUnsupported) return []
    const card = this.selfCard as CocCard | undefined
    if (!card) return []
    let updated = false
    Object.keys(this.skill2Growth).forEach(skill => {
      const entry = card.getEntry(skill)
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
    return updated ? [card] : []
  }
}
