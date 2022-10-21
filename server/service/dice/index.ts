import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { AliasExpressions } from './alias'

type GetFunc = (key: string) => string | number
type DeciderFunc = (desc: string, value: number) => string

export class PtDiceRoll {

  times = 1
  hide = false
  skip = false
  expression = ''
  description = ''
  private isAlias = false

  rolls: DiceRoll[] = []
  medianRolls?: PtDiceRoll[]

  get hasMedianRolls() {
    return this.medianRolls && this.medianRolls.length > 0
  }

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

  // 从模板解析得到 DiceRoll 实例
  static fromTemplate(expression: string, get: GetFunc) {
    const medianRolls: PtDiceRoll[] = []
    const parsed = parseTemplate(expression, get, medianRolls)
    const roll = new PtDiceRoll(parsed)
    roll.medianRolls = medianRolls // 保存中间骰结果
    return roll
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
    const match = expression.match(/^(h|q|x\d+|\s)*/) // q - quiet
    if (match) {
      const flags = match[0]
      if (flags.includes('h')) this.hide = true
      if (flags.includes('q')) this.skip = true
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

  get firstTotal() {
    return this.rolls[0].total // 如果单骰（times===1）就是结果。如果多连骰，则取第一个结果
  }

  format(username: string, { isMedian = false }, decide?: DeciderFunc) {
    // isMedian 处理
    if (isMedian) {
      const roll = this.rolls[0] // isMedian 多重投骰只取第一个
      return `🎲 ${this.skip ? `${roll.notation} = ${roll.total}` : roll.output} ${decide?.(this.description, roll.total) || ''}`
    }
    // 正常情况
    const lines = [`${username} 🎲 ${this.description}`]
    // 是否有中间骰
    if (this.hasMedianRolls) {
      const medianLines = this.medianRolls!.map((roll, i) => {
        return `${i === 0 ? '先是' : '然后' } ${roll.format(username, { isMedian: true }, decide)}`
      })
      if (!this.skip) lines.push(...medianLines) // skip 了就不拼。注意即使 skip 也要调用 decide 的逻辑，因为这个逻辑会有副作用
    }
    // 普通骰
    const rollLines = this.rolls.map(roll => {
      return `${this.skip ? `${roll.notation} = ${roll.total}` : roll.output} ${decide?.(this.description, roll.total) || ''}`
    })
    // 有中间骰的情况下，普通骰也增加前缀
    if (this.hasMedianRolls) {
      if (rollLines.length === 1) {
        rollLines[0] = '最后 ' + rollLines[0]
      } else {
        rollLines.unshift('最后')
      }
    }
    // 判断是否是展示在一行
    if (lines.length === 1 && rollLines.length === 1) {
      return `${lines[0]} ${rollLines[0]}`
    } else {
      return [...lines, ...rollLines].join('\n')
    }
  }
}

const templateRegex = /\[([^[\]]+)\]/
function parseTemplate(expression: string, get: GetFunc, history: PtDiceRoll[]): string {
  if (templateRegex.test(expression)) {
    // 替换 [xxx]
    expression = expression.replace(templateRegex, (_, notation: string) => {
      // 替换历史骰子
      notation = notation.replace(/\$(\d+)/, (_, index: string) => {
        const historyRoll = history[Number(index) - 1] // $1 代表 roller.log[0]
        return historyRoll ? String(historyRoll.firstTotal) : ''
      })
      // 替换变量
      notation = notation.replace(/\$(\w+)/, (_, key: string) => {
        return String(get(key) ?? '')
      })
      // 如果是暗骰则不显示，否则返回值
      const dice = new PtDiceRoll(notation.trim())
      history.push(dice) // median roll 存起来
      return dice.hide ? '' : String(dice.firstTotal)
    })
    return parseTemplate(expression, get, history)
  }
  return expression
}
