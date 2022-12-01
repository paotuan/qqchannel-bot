import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { parseDescriptions, SuccessLevel, parseTemplate } from '../utils'
import { BasePtDiceRoll } from '../index'
import type { ICocCardEntry } from '../../card/coc'
import { calculateTargetValueWithDifficulty } from '../../card/coc'
import type { IRollDecideResult } from '../../config/helpers/decider'

export class StandardDiceRoll extends BasePtDiceRoll {

  protected times = 1
  hidden = false
  protected quiet = false
  expression = ''
  description = ''
  protected isAlias = false
  protected tempValue = NaN // 临时检定值

  protected rolls: DiceRoll[] = []
  protected cardEntry?: ICocCardEntry | null
  protected decideResults: (IRollDecideResult | undefined)[] = []
  // side effects
  protected skills2growth: string[] = []

  override roll() {
    this.skills2growth.length = 0
    this.decideResults.length = 0
    this.parse()
    this.rolls = new Array(this.times).fill(this.expression).map(exp => new DiceRoll(exp))
    // 收集副作用
    // 是否是人物卡某项属性的检定
    const entry = this.cardEntry = this.get(this.description, this.tempValue)
    if (entry) {
      this.decideResults = this.rolls.map(roll => {
        const decideResult = this.decide(roll.total, entry)
        if (!entry.isTemp && entry.type === 'skills' && decideResult?.success) {
          this.skills2growth.push(entry.name) // 非临时值且检定成功，记录人物卡技能成长
        }
        return decideResult
      })
    }
    return this
  }

  // 解析指令，最终结果存入 this.expression
  private parse() {
    const removeAlias = this.parseAlias(this.rawExpression).trim()
    const removeR = removeAlias.startsWith('r') ? removeAlias.slice(1).trim() : removeAlias
    const removeFlags = this.parseFlags(removeR).trim()
    this.parseDescriptions(removeFlags)
    this.detectDefaultRoll()
    console.log('[Dice] 原始指令', this.rawExpression, '解析指令', this.expression, '描述', this.description, '临时值', this.tempValue, '暗骰', this.hidden, '省略', this.quiet, '次数', this.times)
  }

  // 解析别名指令
  private parseAlias(expression: string) {
    const parsed = this.context.config.parseAliasRoll(expression, this.context, this.inlineRolls)
    if (parsed && expression !== parsed.expression) { // 解析前后不相等，代表命中了别名解析逻辑
      this.isAlias = true
      this.expression = parsed.expression
      return parsed.rest
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

  protected parseDescriptions(expression: string) {
    const [exp, desc, tempValue] = parseDescriptions(expression)
    // 如果是 alias dice，则认为 expression 已经由 config 指定，无视解析出的 exp
    if (this.isAlias) {
      this.description = desc
      this.tempValue = tempValue
      return
    }
    // 如果只有 desc，没有 exp，判断一下是否是直接调用人物卡的表达式
    // 例如【.徒手格斗】直接替换成【.1d3+$db】. 而【.$徒手格斗】走通用逻辑，求值后【.const】
    if (desc && !exp) {
      const ability = this.selfCard?.getAbility(desc)
      if (ability) {
        this.expression = parseTemplate(ability.value, this.context, this.inlineRolls)
        this.description = desc
        this.tempValue = tempValue
        return
      }
    }
    // 默认情况，分别代入即可
    this.expression = exp
    this.description = desc
    this.tempValue = tempValue
  }

  private detectDefaultRoll() {
    if (this.expression === '' || this.expression === 'd') {
      this.expression = this.defaultRoll
    }
  }

  override get output() {
    const descriptionStr = this.description ? ' ' + this.description : '' // 避免 description 为空导致连续空格
    const lines = [`${this.context.username} 🎲${descriptionStr}`]
    // 是否有中间骰
    if (this.hasInlineRolls && !this.quiet) {
      const inlineLines = this.inlineRolls.map((roll, i) => {
        return `${i === 0 ? '先是' : '然后' } ${roll.output}`
      })
      lines.push(...inlineLines)
    }
    // 普通骰
    const rollLines = this.rolls.map((roll, i) => {
      const decideResult = this.decideResults[i]?.desc || ''
      return `${this.quiet ? `${roll.notation} = ${roll.total}` : roll.output} ${decideResult}`
    })
    // 有中间骰且没有 quiet 的情况下，普通骰也增加前缀，以便与中间骰对应起来
    if (this.hasInlineRolls && !this.quiet) {
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
    const card = this.selfCard
    if (!card) return []
    const inlineSkills2growth = this.inlineRolls.map(inlineRoll => inlineRoll.skills2growth).flat()
    const uniqSkills = Array.from(new Set([...inlineSkills2growth, ...this.skills2growth]))
    let needUpdate = false
    uniqSkills.forEach(skill => {
      const updated = card.markSkillGrowth(skill)
      needUpdate ||= updated
    })
    return needUpdate ? [card] : []
  }

  // 是否可以用于对抗
  get eligibleForOpposedRoll() {
    if (this.hidden) return false
    if (this.times !== 1) return false
    return this.decideResults.length !== 0 && this.decideResults[0]
  }

  // 用于对抗检定的数据
  /* protected */ getSuccessLevelForOpposedRoll() {
    const rollValue = this.rolls[0].total
    const decideResult = this.decideResults[0]! // eligibleForOpposedRoll 确保了检定结果存在
    const baseValue = this.cardEntry!.baseValue
    const res = { username: this.context.username, skill: this.cardEntry!.name, baseValue }
    if (decideResult.level === SuccessLevel.REGULAR_SUCCESS) {
      // 成功的检定，要比较成功等级哪个更高
      if (rollValue <= calculateTargetValueWithDifficulty(baseValue, 'ex')) {
        return Object.assign(res, { level: SuccessLevel.EX_SUCCESS })
      } else if (rollValue <= calculateTargetValueWithDifficulty(baseValue, 'hard')) {
        return Object.assign(res, { level: SuccessLevel.HARD_SUCCESS })
      } else {
        return Object.assign(res, { level: SuccessLevel.REGULAR_SUCCESS })
      }
    } else {
      return Object.assign(res, { level: decideResult.level })
    }
  }
}
