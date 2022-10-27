import type { IDiceRollContext } from './utils'
import type { MedianDiceRoll } from './standard/median'
import type { CocCard } from '../card/coc'
import { getMedianDiceRollKlass } from './standard/median'

export abstract class BasePtDiceRoll {
  protected readonly rawExpression: string
  protected readonly context: IDiceRollContext
  protected readonly medianRolls: MedianDiceRoll[] = []

  protected get(key: string) {
    return this.context.card?.getEntry(key) ?? null
  }

  protected get decide() {
    return this.context.decide
  }

  protected get hasMedianRolls() {
    return this.medianRolls.length > 0
  }

  // fullExp: 去除了 @ . 。 前缀的完整表达式
  constructor(fullExp: string, context: IDiceRollContext) {
    this.rawExpression = fullExp
    this.context = context
    // this.roll() // 防止构造器调用子类 roll 访问到子类的实例变量导致未初始化，目前由外部调用完构造函数之后调用
  }

  // 掷骰，收集掷骰过程中的副作用。理论上来说只会调用一次
  abstract roll(): this

  // 掷骰的结果用于展示
  abstract get output(): string

  // 应用副作用修改人物卡，返回人物卡是否真正修改了
  abstract applyTo(card: CocCard): boolean

  // 解析含中括号的表达式模板，返回替换后的表达式，并把中途的骰子结果存入 medianRolls 中
  protected parseTemplate() {
    this.medianRolls.length = 0
    return parseTemplate(this.rawExpression, this.context, this.medianRolls)
  }
}

const templateRegex = /\[([^[\]]+)\]/
export function parseTemplate(expression: string, context: IDiceRollContext, history: MedianDiceRoll[]): string {
  if (templateRegex.test(expression)) {
    // 读取人物卡变量方法
    const get = (key: string) => context.card?.getEntry(key)?.value || ''
    // 替换 [xxx]
    expression = expression.replace(templateRegex, (_, notation: string) => {
      // 替换历史骰子
      notation = notation.replace(/\$(\d+)/, (_, index: string) => {
        const historyRoll = history[Number(index) - 1] // $1 代表 roller.log[0]
        return historyRoll ? String(historyRoll.total) : ''
      })
      // 替换变量
      notation = notation.replace(/\$([\w\p{Unified_Ideograph}]+)/u, (_, key: string) => {
        return String(get(key) ?? '')
      })
      // 如果是暗骰则不显示，否则返回值
      const MedianDiceRoll = getMedianDiceRollKlass()
      const dice = new MedianDiceRoll(notation.trim(), context).roll()
      history.push(dice) // median roll 存起来
      return dice.hidden ? '' : String(dice.total)
    })
    return parseTemplate(expression, context, history)
  }
  return expression
}
