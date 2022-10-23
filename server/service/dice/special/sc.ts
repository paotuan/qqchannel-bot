import { BasePtDiceRoll, DeciderFunc } from '../index'
import { parseDescriptions } from '../utils'

export class ScDiceRoll extends BasePtDiceRoll {
  noModify = false
  expression1 = ''
  expression2 = ''
  description = ''

  // sc1d10/1d100直视伟大的克苏鲁
  // sc! 不修改人物卡
  constructor(fullExp: string) {
    super(fullExp)
    const removeSc = fullExp.slice(2).trim()
    const removeFlags = this.parseFlags(removeSc)
    this.parseDescriptions(removeFlags)
    this.detectDefaultRoll()
  }

  private parseFlags(expression: string) {
    if (expression.startsWith('!') || expression.startsWith('！')) {
      this.noModify = true
      return expression.slice(1).trim()
    } else {
      return expression
    }
  }

  private parseMain(expression: string) {
    let exp2andDesc = expression
    const firstSplitIndex = expression.indexOf('/')
    if (firstSplitIndex >= 0) {
      this.expression1 = expression.slice(0, firstSplitIndex).trim()
      exp2andDesc = expression.slice(firstSplitIndex).trim()
    }
    // 没有 / 的时候就认为 exp1=exp2 吧
    const [exp, desc] = parseDescriptions(exp2andDesc)
    this.expression2 = exp
    this.expression1 ||= exp
    this.description = desc
  }

  private detectDefaultRoll(defaultRoll = 'd%') {
    if (this.expression1 === '' || this.expression1 === 'd') {
      this.expression1 = defaultRoll // todo 默认骰
    }
    if (this.expression2 === '' || this.expression2 === 'd') {
      this.expression2 = defaultRoll // todo 默认骰
    }
  }

  format(username: string, decide?: DeciderFunc) {
    // todo 特殊骰子还是依赖人物卡的，光靠 decide 方法不够
  }
}
