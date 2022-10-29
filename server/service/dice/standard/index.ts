import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { AliasExpressions } from '../alias'
import { IDeciderResult, parseDescriptions } from '../utils'
import { BasePtDiceRoll } from '../index'

export class StandardDiceRoll extends BasePtDiceRoll {

  protected times = 1
  hidden = false
  protected quiet = false
  expression = ''
  description = ''
  protected isAlias = false
  protected tempValue = NaN // 临时检定值

  protected rolls: DiceRoll[] = []
  protected decideResults: IDeciderResult[] = []
  // side effects
  protected skills2growth: string[] = []

  override roll() {
    this.skills2growth.length = 0
    this.decideResults.length = 0
    this.parse()
    this.rolls = new Array(this.times).fill(this.expression).map(exp => new DiceRoll(exp))
    // 收集副作用
    // 是否是人物卡某项属性的检定
    const entry = this.get(this.description, this.tempValue)
    if (entry) {
      this.decideResults = this.rolls.map(roll => {
        const decideResult = this.decide(roll.total, entry)
        if (!entry.isTemp && decideResult.success) {
          this.skills2growth.push(entry.name) // 非临时值且检定成功，记录人物卡技能成长
        }
        return decideResult
      })
    }
    return this
  }

  // 解析指令，最终结果存入 this.expression
  private parse() {
    const parsedExpression = this.parseTemplate() // median rolls 在这一步 roll 了
    const removeAlias = this.parseAlias(parsedExpression).trim()
    const removeR = removeAlias.startsWith('r') ? removeAlias.slice(1).trim() : removeAlias
    const removeFlags = this.parseFlags(removeR).trim()
    this.parseDescriptions(removeFlags)
    this.detectDefaultRoll()
    console.log('[Dice] 原始指令：', this.rawExpression, '解析指令：', this.expression, '描述：', this.description, '暗骰：', this.hidden, '省略：', this.quiet, '次数：', this.times)
  }

  private parseAlias(expression: string) {
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

  private parseFlags(expression: string) {
    const match = expression.match(/^(h|q|x\d+|\s)*/)
    if (match) {
      const flags = match[0]
      if (flags.includes('h')) this.hidden = true
      if (flags.includes('q')) this.quiet = true
      const timesMatch = flags.match(/x(\d+)/)
      if (timesMatch) {
        const times = parseInt(timesMatch[1], 10)
        this.times = Math.max(1, Math.min(10, times)) // 最多10连，至少一个
      }
      return expression.slice(flags.length)
    }
    return expression
  }

  private parseDescriptions(expression: string) {
    const [exp, desc, tempValue] = parseDescriptions(expression)
    // 如果是 alias dice，则认为 expression 已经由 config 指定，无视解析出的 exp
    if (!this.isAlias) {
      this.expression = exp
    }
    this.description = desc
    this.tempValue = tempValue
  }

  private detectDefaultRoll(defaultRoll = 'd%') {
    if (this.expression === '' || this.expression === 'd') {
      this.expression = defaultRoll // todo 默认骰
    }
  }

  override get output() {
    const descriptionStr = this.description ? ' ' + this.description : '' // 避免 description 为空导致连续空格
    const lines = [`${this.context.username} 🎲${descriptionStr}`]
    // 是否有中间骰
    if (this.hasMedianRolls && !this.quiet) {
      const medianLines = this.medianRolls.map((roll, i) => {
        return `${i === 0 ? '先是' : '然后' } ${roll.output}`
      })
      lines.push(...medianLines)
    }
    // 普通骰
    const rollLines = this.rolls.map((roll, i) => {
      const decideResult = this.decideResults[i]?.desc || ''
      return `${this.quiet ? `${roll.notation} = ${roll.total}` : roll.output} ${decideResult}`
    })
    // 有中间骰且没有 skip 的情况下，普通骰也增加前缀，以便与中间骰对应起来
    if (this.hasMedianRolls && !this.quiet) {
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

  override applyToCard() {
    const card = this.context.card
    if (!card) return false
    const medianSkills2growth = this.medianRolls.map(medianRoll => medianRoll.skills2growth).flat()
    const uniqSkills = Array.from(new Set([...medianSkills2growth, ...this.skills2growth]))
    let needUpdate = false
    uniqSkills.forEach(skill => {
      const updated = card.markSkillGrowth(skill)
      needUpdate ||= updated
    })
    return needUpdate
  }
}
