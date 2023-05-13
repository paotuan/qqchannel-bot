import { StandardDiceRoll } from './index'
import { DndCard, getPropOfSkill } from '../../../../interface/card/dnd'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import type { IRollDecideResult } from '../../config/helpers/decider'

export class DndDiceRoll extends StandardDiceRoll {

  override get selfCard() {
    return super.selfCard as DndCard | undefined // 如果有 card，必须是 dnd card
  }

  override roll(): this {
    super.parse()
    // 掷骰
    for (let i = 0; i < this.times; i++) {
      // 1. 如果没有 expression，就正常 roll
      if (this.skillsForTest.length === 0) {
        this.rolls.push({ roll: new DiceRoll(this.expression), tests: [] })
        continue
      }
      // 2. 根据描述拿 entry
      this.skillsForTest.forEach(({ skill, tempValue: dc }) => {
        const entry = this.selfCard?.getEntry(skill)
        let finalExpression: string
        // 根据 entry 类型拼接真正掷骰的 expression
        if (entry && entry.type === 'props' && entry.postfix === 'none') {
          // 基本属性检定，取属性调整值
          const modifiedValue = this.selfCard?.getEntry(`${entry.key}调整`)?.value
          finalExpression = typeof modifiedValue === 'number' ? `${this.expression}+${modifiedValue}` : this.expression
        } else if (entry && entry.type === 'skills') {
          // 技能检定，取属性调整值 + 技能调整值 + 技能是否熟练
          const propName = getPropOfSkill(entry.key)
          const modifiedValue = this.selfCard?.getEntry(`${propName}调整`)?.value // 属性调整
          const skillValue = entry.value // 技能调整
          const experiencedValue = this.selfCard?.data.meta.experienced[entry.key] ? this.selfCard.data.basic.熟练 : 0
          const addition = [modifiedValue, skillValue, experiencedValue].filter(i => !!i).map(i => '+' + i).join('')
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
        if (!isNaN(dc)) {
          result = this.decide({ baseValue: dc, targetValue: dc, roll: roll.total })
        }
        // 4. 加入结果
        this.rolls.push({ roll, tests: [{ skill, cardEntry: entry, result }] }) // 这里传的 entry 目前不重要
      })
    }
    return this
  }

  override get eligibleForOpposedRoll() {
    if (this.hidden) return false
    // 单轮投骰, 没描述也没关系，反正最后是比大小
    return this.rolls.length === 1
  }

  // 用于对抗检定的数据
  /* protected */ getDataForOpposedRoll() {
    return {
      value: this.rolls[0].roll.total,
      skill: this.rolls[0].tests[0]?.skill ?? '',
      username: this.context.username
    }
  }
}
