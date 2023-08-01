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
    return {
      // 通用参数这里也要提供一下，因为对抗检定有[对方xxx]
      用户名: this.context.username,
      人物卡名: this.selfCard?.name ?? this.context.username,
      at用户: this.context.userId === 'system' ? this.context.username : `<@!${this.context.userId}>`,
      描述: entry.key,
      掷骰结果: rollResult.roll.total,
      掷骰表达式: rollResult.roll.notation,
      掷骰输出: rollResult.roll.output,
      // 以下都是 coc 特有
      技能值: entry.baseValue, // coc 特有的因为可能存在难度前缀导致目标值与技能值不同
      目标值: entry.value, //entry.baseValue,
      成功等级: decideResult.level,
      成功: ['大成功', '极难成功', '困难成功', '成功'].includes(decideResult.level),
      大成功: decideResult.level === '大成功',
      极难成功: decideResult.level === '极难成功',
      困难成功: decideResult.level === '困难成功',
      常规成功: decideResult.level === '成功',
      常规失败: decideResult.level === '失败',
      大失败: decideResult.level === '大失败'
    }
  }

  protected override getFormatArgs(roll: DiceRoll, test?: any) {
    const _test = test as ICocCardEntry | undefined
    return {
      ...super.getFormatArgs(roll, test),
      // coc 额外追加是否是 困难/极难 前缀
      困难前缀: _test?.difficulty === 'hard',
      极难前缀: _test?.difficulty === 'ex',
      无前缀: _test?.difficulty === 'normal'
    }
  }
}
