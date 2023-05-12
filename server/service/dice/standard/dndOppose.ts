import { DndDiceRoll } from './dnd'
import { StandardDiceRoll } from './index'

export class DndOpposedRoll extends DndDiceRoll {

  private get opposedRoll() {
    return this.context.opposedRoll!
  }

  override parseDescriptions(expression: string) {
    super.parseDescriptions(expression)
    // 回复消息进行对抗检定时，如果没有指定技能名描述，就认为是取相同的技能进行对抗
    if (this.skillsForTest.length === 0 && this.opposedRoll.skillsForTest.length > 0) {
      const skill = this.opposedRoll.skillsForTest[0].skill
      // 只取 skill，tempValue 是 dnd 的 dc，在对抗时是没有意义的
      this.skillsForTest.push({ skill, tempValue: NaN })
    }
  }

  override get output() {
    const opposedResult = this.calculateResult(this.opposedRoll)
    if (opposedResult) {
      return super.output + '\n' + opposedResult
    } else {
      return super.output
    }
  }

  // 判断对抗检定结果
  private calculateResult(other: StandardDiceRoll) {
    if (!(other instanceof DndDiceRoll)) return ''
    if (!this.eligibleForOpposedRoll || !other.eligibleForOpposedRoll) return ''
    // 比大小
    const selfResult = this.getDataForOpposedRoll()
    const otherResult = other.getDataForOpposedRoll()
    const selfSuccess = selfResult.value > otherResult.value ? 'success' : selfResult.value === otherResult.value ? 'draw' : 'fail'
    const otherSuccess = selfResult.value > otherResult.value ? 'fail' : selfResult.value === otherResult.value ? 'draw' : 'success'
    // 组装结果
    const icon = { success: '🟩', fail: '🟥', draw: '🟨' }
    return [
      icon[selfSuccess],
      selfResult.username,
      selfResult.skill,
      selfResult.value,
      '↔️',
      otherResult.username,
      otherResult.skill,
      otherResult.value,
      icon[otherSuccess]
    ].join(' ')
  }
}
