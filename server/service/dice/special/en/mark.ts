import { BasePtDiceRoll } from '../../index'
import { CocCard } from '../../../../../interface/card/coc'

type MarkMode = 'add' | 'remove' | 'clear'

// en+ xx,yy,zz
export class EnMarkDiceRoll extends BasePtDiceRoll {

  private mode?: MarkMode
  private readonly skillNames: string[] = []

  // 如果未关联 CocCard，认为不支持
  private get isCardUnsupported() {
    return !this.selfCard || !(this.selfCard instanceof CocCard)
  }

  override roll() {
    if (this.isCardUnsupported) return this
    const removeEn = this.rawExpression.slice(2).trim()
    const [mode, removeMode] = parseMode(removeEn)
    this.mode = mode
    if (mode !== 'clear') {
      // 拆分技能名
      const segments = removeMode.split(/[,，;；、\s]+/).filter(segment => !!segment.trim())
      this.skillNames.push(...segments) // 无需计算名称是否存在、别名等逻辑。card 内部会处理
    }
    return this
  }

  override get output() {
    // 不支持的人物卡
    if (this.isCardUnsupported) {
      return this.t('roll.en.empty')
    }
    // 未指定技能名
    if (this.mode !== 'clear' && this.skillNames.length === 0) {
      return this.t('roll.en.empty')
    }
    if (this.mode === 'clear') {
      return this.t('roll.en.markclear')
    }
    const skills = this.skillNames
    return this.t('roll.en.mark', {
      技能列表: skills.map((技能名, i) => ({ 技能名, last: i === skills.length - 1 })),
      技能唯一: skills.length === 1,
      技能名: skills[0],
      添加: this.mode === 'add'
    })
  }

  override applyToCard() {
    if (this.isCardUnsupported) {
      return []
    }
    let updated = false
    const card = this.selfCard as CocCard
    if (this.mode === 'clear') {
      updated = card.clearSkillGrowth()
    } else if (this.mode === 'add') {
      this.skillNames.forEach(name => {
        if (card.markSkillGrowth(name)) {
          updated = true
        }
      })
    } else if (this.mode === 'remove') {
      this.skillNames.forEach(name => {
        if (card.cancelSkillGrowth(name)) {
          updated = true
        }
      })
    }
    return updated ? [card] : []
  }

}

function parseMode(expression: string): [MarkMode, string] {
  if (expression.startsWith('+')) {
    return ['add', expression.slice(1).trim()]
  } else if (expression.startsWith('-')) {
    return ['remove', expression.slice(1).trim()]
  } else {
    // 外部正则保证了剩下的情况必然是 clear
    return ['clear', ''] // 如果是 clear，那么剩下的部分都不重要了
  }
}
