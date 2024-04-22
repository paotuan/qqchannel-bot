import { CocCard } from '@paotuan/card'
import { BasePtDiceRoll } from '../../base'
import { getAllSkillsCanEn } from './utils'

// en list / enl 列出
export class EnListDiceRoll extends BasePtDiceRoll {

  // 如果未关联 CocCard，认为不支持
  private get isCardUnsupported() {
    return !this.selfCard || !(this.selfCard instanceof CocCard)
  }

  override roll() {
    console.log('[Dice] 成长检定-列出 原始指令', this.rawExpression)
    return this
  }

  override get output() {
    // 不支持的人物卡
    if (this.isCardUnsupported) {
      return this.t('roll.en.empty')
    }
    const skills = getAllSkillsCanEn(this.selfCard)
    if (skills.length > 0) {
      return this.t('roll.en.list', {
        技能列表: skills.map((技能名, i) => ({ 技能名, last: i === skills.length - 1 })),
        技能唯一: skills.length === 1,
        技能名: skills[0]
      })
    } else {
      return this.t('roll.en.empty')
    }
  }
}
