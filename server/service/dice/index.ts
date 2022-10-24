import { GetFunc } from './utils'
import { ScDiceRoll } from './special/sc'
import { StandardDiceRoll } from './standard'
import { MedianDiceRoll } from './standard/median'

export abstract class BasePtDiceRoll {
  // expression = ''
  description = ''
  medianRolls?: MedianDiceRoll[]

  get hasMedianRolls() {
    return this.medianRolls && this.medianRolls.length > 0
  }

  // fullExp: 去除了 @ . 。 前缀的完整表达式
  protected constructor(fullExp: string) {
    // nothing
  }

  // 从模板解析得到 DiceRoll 实例
  static fromTemplate(expression: string, get: GetFunc) {
    const medianRolls: MedianDiceRoll[] = []
    const parsed = parseTemplate(expression, get, medianRolls)
    const roll = this.createDiceRoll(parsed)
    roll.medianRolls = medianRolls // 保存中间骰结果
    return roll
  }

  private static createDiceRoll(expression: string) {
    if (expression.startsWith('sc')) {
      return new ScDiceRoll(expression)
    } else {
      return new StandardDiceRoll(expression)
    }
  }
}


const templateRegex = /\[([^[\]]+)\]/
function parseTemplate(expression: string, get: GetFunc, history: MedianDiceRoll[]): string {
  if (templateRegex.test(expression)) {
    // 替换 [xxx]
    expression = expression.replace(templateRegex, (_, notation: string) => {
      // 替换历史骰子
      notation = notation.replace(/\$(\d+)/, (_, index: string) => {
        const historyRoll = history[Number(index) - 1] // $1 代表 roller.log[0]
        return historyRoll ? String(historyRoll.firstTotal) : ''
      })
      // 替换变量
      notation = notation.replace(/\$([\w\p{Unified_Ideograph}]+)/u, (_, key: string) => {
        return String(get(key) ?? '')
      })
      // 如果是暗骰则不显示，否则返回值
      const dice = new MedianDiceRoll(notation.trim())
      history.push(dice) // median roll 存起来
      return dice.hide ? '' : String(dice.firstTotal)
    })
    return parseTemplate(expression, get, history)
  }
  return expression
}
