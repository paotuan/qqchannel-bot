import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { AliasExpressions } from './alias'

export class PtDiceRoll {

  times = 1
  hide = false
  skip = false
  expression = ''
  description = ''
  private isAlias = false

  rolls: DiceRoll[] = []

  // fullExp: 去除了 @ . 。 前缀的完整表达式
  constructor(fullExp: string) {
    const removeAlias = this.parseAlias(fullExp).trim()
    const removeR = removeAlias.startsWith('r') ? removeAlias.slice(1).trim() : removeAlias
    const removeFlags = this.parseFlags(removeR).trim()
    this.parseDescriptions(removeFlags)
    this.detectDefaultRoll()
    console.log('[Dice] 原始指令：', fullExp, '解析指令：', this.expression, '描述：', this.description, '暗骰：', this.hide, '省略：', this.skip, '次数：', this.times)
    this.roll()
  }

  parseAlias(expression: string) {
    for (const config of AliasExpressions) {
      config.regexCache ??= new RegExp(`^${config.alias}`)
      const match = expression.match(config.regexCache)
      if (match) {
        this.isAlias = true
        this.expression = config.replacer(match)
        return expression.slice(match[0].length)
      }
    }
    return expression
  }

  parseFlags(expression: string) {
    const match = expression.match(/^(h|s|x\d+|\s)*/)
    if (match) {
      const flags = match[0]
      if (flags.includes('h')) this.hide = true
      if (flags.includes('s')) this.skip = true
      const timesMatch = flags.match(/x(\d+)/)
      if (timesMatch) {
        const times = parseInt(timesMatch[1], 10)
        this.times = Math.max(1, Math.min(10, times)) // 最多10连，至少一个
      }
      return expression.slice(flags.length)
    }
    return expression
  }

  parseDescriptions(expression: string) {
    if (this.isAlias) {
      // 如果是 alias dice，则认为 expression 已经由 config 指定，剩下的都是 description
      this.description = expression
    } else {
      const index = expression.search(/[\p{Unified_Ideograph}\s]/u) // 按第一个中文或空格分割
      const [exp, desc = ''] = index < 0 ? [expression] : [expression.slice(0, index), expression.slice(index)]
      this.expression = exp
      this.description = desc.trim()
    }
  }

  detectDefaultRoll(defaultRoll = 'd%') {
    if (this.expression === '' || this.expression === 'd') {
      this.expression = defaultRoll // todo 默认骰
    }
  }

  roll() {
    this.rolls = new Array(this.times).fill(this.expression).map(exp => new DiceRoll(exp))
  }

}
