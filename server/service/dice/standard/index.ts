import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { AliasExpressions } from '../alias'
import { DeciderFunc, parseDescriptions } from '../utils'
import { BasePtDiceRoll } from '../index'

export class StandardDiceRoll extends BasePtDiceRoll {

  times = 1
  hide = false
  skip = false
  expression = ''
  description = ''
  private isAlias = false

  rolls: DiceRoll[] = []

  // fullExp: 去除了 @ . 。 前缀的完整表达式
  constructor(fullExp: string) {
    super(fullExp)
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
      const [exp, desc] = parseDescriptions(expression)
      this.expression = exp
      this.description = desc
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

  format(username: string, decide?: DeciderFunc) {
    const descriptionStr = this.description ? ' ' + this.description : '' // 避免 description 为空导致连续空格
    const lines = [`${username} 🎲${descriptionStr}`]
    // 是否有中间骰
    if (this.hasMedianRolls) {
      const medianLines = this.medianRolls!.map((roll, i) => {
        return `${i === 0 ? '先是' : '然后' } ${roll.format(username, decide)}`
      })
      if (!this.skip) lines.push(...medianLines) // skip 了就不拼。注意即使 skip 也要调用 decide 的逻辑，因为这个逻辑会有副作用
    }
    // 普通骰
    const rollLines = this.rolls.map(roll => {
      const decideResult = decide?.(this.description, roll.total)?.desc || ''
      return `${this.skip ? `${roll.notation} = ${roll.total}` : roll.output} ${decideResult}`
    })
    // 有中间骰且没有 skip 的情况下，普通骰也增加前缀，以便与中间骰对应起来
    if (this.hasMedianRolls && !this.skip) {
      if (rollLines.length === 1) {
        rollLines[0] = '最后 🎲 ' + rollLines[0]
      } else {
        rollLines.unshift('最后 🎲 ')
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
