import { StandardDiceRoll } from './index'
import { DndCard, getPropOfSkill } from '../../../../interface/card/dnd'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import type { IRollDecideResult } from '../../config/helpers/decider'
import { at } from '../utils'

export class DndDiceRoll extends StandardDiceRoll {

  override get selfCard() {
    return super.selfCard as DndCard | undefined // 如果有 card，必须是 dnd card
  }

  override doRoll() {
    // 掷骰
    for (let i = 0; i < this.times; i++) {
      // 1. 如果没有 expression，就正常 roll
      if (this.skillsForTest.length === 0) {
        this.rolls.push({ roll: new DiceRoll(this.expression), tests: [] })
        continue
      }
      // 2. 根据描述拿 entry
      this.skillsForTest.forEach(({ skill, tempValue: dc, modifiedValue }) => {
        const entry = this.selfCard?.getEntry(skill)
        let finalExpression: string
        // 根据 entry 类型拼接真正掷骰的 expression
        if (entry && entry.type === 'props' && entry.postfix === 'none') {
          // 基本属性检定，取属性调整值
          const modifiedValue = this.selfCard?.getEntry(`${entry.key}调整`)?.value
          finalExpression = typeof modifiedValue === 'number' ? `${this.expression}+${modifiedValue}` : this.expression
        } else if (entry && entry.type === 'skills' && entry.postfix === 'none') {
          // 技能检定，取属性调整值 + 技能调整值 + 技能是否熟练
          const propName = getPropOfSkill(entry.key)
          const modifiedValue = this.selfCard?.getEntry(`${propName}调整`)?.value // 属性调整
          const skillValue = this.selfCard?.getEntry(`${entry.key}修正`)?.value  // 技能修正
          const experiencedValue = this.selfCard?.data.meta.experienced[entry.key] ? this.selfCard.data.basic.熟练 : 0
          const addition = `+{${modifiedValue}}[${propName}]` // 属性调整不管是不是 0 都写上吧
            + (skillValue ? `+{${skillValue}}[修正]` : '')
            + (experiencedValue ? `+{${experiencedValue}}[熟练]` : '')
          finalExpression = `${this.expression}${addition}`
        } else if (entry && entry.type === 'props' && entry.postfix === 'saving') {
          // 属性豁免检定
          finalExpression = `${this.expression}+${entry.value}`
        } else {
          // 其他情况：没人物卡，没对应 entry，或 entry 不对应任何一种有效的检定
          finalExpression = this.expression
        }
        // 3. 掷骰，如传了 dc 则进行检定
        const roll = new DiceRoll(finalExpression)
        let result: IRollDecideResult | undefined = undefined
        const targetValue = dc + (modifiedValue || 0) // 如有 dc 调整值则加上。如没有 dc 即 dc=NaN，结果也是 NaN
        if (!isNaN(dc)) {
          result = this.decide({ baseValue: dc, targetValue, roll: roll.total })
        }
        // 4. 加入结果
        this.rolls.push({ roll, tests: [{ skill, targetValue, cardEntry: entry, result }] }) // 这里传的 entry 目前不重要
      })
    }
  }

  override get eligibleForOpposedRoll() {
    if (this.hidden) return false
    // 单轮投骰, 没描述也没关系，反正最后是比大小
    return this.rolls.length === 1
  }

  // 用于对抗检定的数据
  /* protected */ getDataForOpposedRoll() {
    const rollResult = this.rolls[0]
    const test = rollResult.tests[0]
    return {
      // 通用参数这里也要提供一下，因为对抗检定有[对方xxx]
      用户名: this.context.username,
      人物卡名: this.selfCard?.name ?? this.context.username,
      at用户: this.context.userId === 'system' ? this.context.username : at(this.context.userId),
      描述: test?.skill ?? '',
      掷骰结果: rollResult.roll.total,
      掷骰表达式: rollResult.roll.notation,
      掷骰输出: rollResult.roll.output,
    }
  }

  protected override getRollStartArgs() {
    return { ...super.getRollStartArgs(), dnd: true }
  }

  protected override getFormatArgs(roll: DiceRoll, test?: any) {
    return { ...super.getFormatArgs(roll, test), dnd: true }
  }
}
