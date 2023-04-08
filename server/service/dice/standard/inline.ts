import { StandardDiceRoll } from './index'

export type InlineDiceRoll = InstanceType<ReturnType<typeof getInlineDiceRollKlass>>

let klass: ReturnType<typeof initClass>

// 延迟初始化解决 StandardDiceRoll 到 InlineDiceRoll 的循环引用问题
export function getInlineDiceRollKlass() {
  if (!klass) {
    klass = initClass()
  }
  return klass
}

function initClass() {
  return class InlineDiceRoll extends StandardDiceRoll {

    private get diceRoll() {
      return this.rolls[0]
    }

    // private get decideResult() {
    //   return this.decideResults[0]
    // }

    get total() {
      return this.diceRoll!.total // 如果单骰（times===1）就是结果。如果多连骰，则取第一个结果
    }

    override get output() {
      const descriptionStr = this.description ? ' ' + this.description : '' // 避免 description 为空导致连续空格
      const roll = this.diceRoll!
      // const decideResult = this.decideResult?.desc || ''
      // return `🎲${descriptionStr} ${this.quiet ? `${roll.notation} = ${roll.total}` : roll.output} ${decideResult}`.trim()
      return `🎲${descriptionStr} ${this.quiet ? `${roll.notation} = ${roll.total}` : roll.output}`.trim()
    }
  }
}
