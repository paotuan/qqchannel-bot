import { StandardDiceRoll } from './index'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import type { IRollDecideResult } from '../../config/helpers/decider'
import { CocCard, getCocTempEntry, ICocCardEntry } from '../../../../interface/card/coc'

export class CocDiceRoll extends StandardDiceRoll {
  // 标记技能检定列表
  protected skills2growth: string[] = []

  override get selfCard() {
    return super.selfCard as CocCard | undefined // 如果有 card，必须是 coc card
  }

  override roll() {
    super.parse()
    // 掷骰
    for (let i = 0; i < this.times; i++) {
      const roll = new DiceRoll(this.expression)
      this.rolls.push({
        roll,
        tests: this.skillsForTest.map(({ skill, tempValue }) => {
          let result: IRollDecideResult | undefined = undefined
          let cardEntry = this.selfCard?.getEntry(skill)
          if (!cardEntry && !isNaN(tempValue)) {
            cardEntry = getCocTempEntry(skill, tempValue)
          }
          if (cardEntry) {
            result = this.decide({ baseValue: cardEntry.baseValue, targetValue: cardEntry.value, roll: roll.total })
            // 非临时值且检定成功，记录人物卡技能成长
            if (!cardEntry.isTemp && cardEntry.type === 'skills' && result?.success) {
              this.skills2growth.push(cardEntry.key)
            }
          }
          return { skill, cardEntry, result }
        })
      })
    }
    return this
  }

  override applyToCard() {
    const card = this.selfCard as CocCard
    if (!card) return []
    const uniqSkills = Array.from(new Set(this.skills2growth))
    let needUpdate = false
    // 如标记了对抗骰，则根据规则书不标记技能成长
    if (!this.vsFlag) {
      uniqSkills.forEach(skill => {
        const updated = card.markSkillGrowth(skill)
        needUpdate ||= updated
      })
    }
    return needUpdate ? [card] : []
  }

  // 是否可以用于对抗
  override get eligibleForOpposedRoll() {
    if (this.hidden) return false
    // 单轮投骰 & 有且仅有一个技能检定 & 技能检定有结果
    return this.rolls.length === 1 && this.rolls[0].tests.length === 1 && !!this.rolls[0].tests[0].result
  }

  // 用于对抗检定的数据
  /* protected */ getSuccessLevelForOpposedRoll() {
    // eligibleForOpposedRoll 确保了 rollResult 和 test 有且仅有一个
    const rollResult = this.rolls[0]
    const test = rollResult.tests[0]
    // 组装对抗检定数据
    const decideResult = test.result!
    const entry = test.cardEntry! as ICocCardEntry
    const baseValue = entry.baseValue
    return { username: this.context.username, skill: entry.key, baseValue, level: decideResult.level, success: decideResult.success }
  }
}
