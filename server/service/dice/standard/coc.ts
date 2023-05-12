import { StandardDiceRoll } from './index'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import type { IRollDecideResult } from '../../config/helpers/decider'
import { getCocTempEntry, calculateTargetValueWithDifficulty, CocCard, ICocCardEntry } from '../../../../interface/card/coc'
import { SuccessLevel } from '../utils'

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

  override get output() {
    let content = super.output
    // 判断是否需要对抗标记
    if (this.vsFlag && this.eligibleForOpposedRoll) {
      content += '\n> 回复本条消息以进行对抗'
    }
    return content
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
  /* protected */ getSuccessLevelForOpposedRoll(refineSuccessLevels = true) {
    // eligibleForOpposedRoll 确保了 rollResult 和 test 有且仅有一个
    const rollResult = this.rolls[0]
    const test = rollResult.tests[0]
    // 组装对抗检定数据
    const rollValue = rollResult.roll.total
    const decideResult = test.result!
    const entry = test.cardEntry! as ICocCardEntry
    const baseValue = entry.baseValue
    const res = { username: this.context.username, skill: entry.key, baseValue }
    if (decideResult.level === SuccessLevel.REGULAR_SUCCESS) {
      // 成功的检定，如设置 refineSuccessLevels，要比较成功等级哪个更高
      if (refineSuccessLevels && rollValue <= calculateTargetValueWithDifficulty(baseValue, 'ex')) {
        return Object.assign(res, { level: SuccessLevel.EX_SUCCESS })
      } else if (refineSuccessLevels && rollValue <= calculateTargetValueWithDifficulty(baseValue, 'hard')) {
        return Object.assign(res, { level: SuccessLevel.HARD_SUCCESS })
      } else {
        return Object.assign(res, { level: SuccessLevel.REGULAR_SUCCESS })
      }
    } else {
      return Object.assign(res, { level: decideResult.level })
    }
  }
}
