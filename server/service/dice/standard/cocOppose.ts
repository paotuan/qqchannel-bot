import { StandardDiceRoll } from './index'
import { CocDiceRoll } from './coc'
import type { SuccessLevel } from '../../../../interface/config'

// 对抗检定
// this.context.opposedRoll 代表要和本次对抗的 roll
export class CocOpposedDiceRoll extends CocDiceRoll {

  override parseDescriptions(expression: string) {
    super.parseDescriptions(expression)
    // 回复消息进行对抗检定时，如果没有指定技能名描述，就认为是取相同的技能进行对抗
    if (this.skillsForTest.length === 0) {
      this.skillsForTest.push(this.context.opposedRoll!.skillsForTest[0])
    }
  }

  override get output() {
    const opposedResult = this.opposedRoll(this.context.opposedRoll!)
    if (opposedResult) {
      return super.output + '\n' + opposedResult
    } else {
      return super.output
    }
  }

  override applyToCard() {
    // 对抗检定不标记成长
    return []
  }

  // 判断对抗检定结果
  private opposedRoll(other: StandardDiceRoll) {
    if (!(other instanceof CocDiceRoll)) return ''
    if (!this.eligibleForOpposedRoll || !other.eligibleForOpposedRoll) return ''
    // 1. 判断各自成功等级 大失败-2 失败-1 成功1 困难成功2 极难成功3 大成功4
    const selfResult = this.getSuccessLevelForOpposedRoll()
    const otherResult = other.getSuccessLevelForOpposedRoll()
    // 2. 比较
    const selfSuccess = (() => {
      if (!selfResult.成功) {
        return 'lose' // 本身就失败
      } else { // 本身成功，和对方判断
        if (selfResult.成功等级 === otherResult.成功等级) { // 等级一样
          if (selfResult.技能值 === otherResult.技能值) return 'draw' // 数值也一样，平局
          return selfResult.技能值 > otherResult.技能值 ? 'win' : 'lose' // 数值越大越好
        } else { // 等级不一样，谁高谁赢
          return compareCocSuccessLevel(selfResult.成功等级, otherResult.成功等级) > 0 ? 'win' : 'lose'
        }
      }
    })()
    const otherSuccess = (() => {
      if (selfSuccess === 'lose') { // 我方失败，对方可能成功可能失败
        return !otherResult.成功 ? 'lose' : 'win'
      } else { // 我方平局或成功，对方就是相反结果
        return selfSuccess === 'draw' ? 'draw' : 'lose'
      }
    })()
    // 3. 组装
    const _otherArgs = Object.entries(otherResult).reduce((o, [k, v]) => Object.assign(o, { ['对方' + k]: v }), {})
    const args = {
      ...selfResult,
      ..._otherArgs,
      胜: selfSuccess === 'win',
      负: selfSuccess === 'lose',
      平: selfSuccess === 'draw',
      对方胜: otherSuccess === 'win',
      对方负: otherSuccess === 'lose',
      对方平: otherSuccess === 'draw',
      coc: true
    }
    return this.t('roll.vs.result', args)
  }
}

// coc 成功等级比较
const _successLevelCode: Record<SuccessLevel, number> = {
  '大失败': -2,
  '失败': -1,
  '成功': 1,
  '困难成功': 2,
  '极难成功': 3,
  '大成功': 4
}

function compareCocSuccessLevel(a: SuccessLevel, b: SuccessLevel) {
  return _successLevelCode[a] - _successLevelCode[b]
}
