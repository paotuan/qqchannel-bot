import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { SuccessLevel, parseTemplate, parseDescriptions2 } from '../utils'
import { BasePtDiceRoll } from '../index'
import { calculateTargetValueWithDifficulty } from '../../../../interface/card/coc'
import type { IRollDecideResult } from '../../config/helpers/decider'
import type { ICocCardEntry } from '../../../../interface/card/coc'

interface IRollResult {
  roll: DiceRoll
  // 一次 roll 可能同时检定多个技能，也可能没有
  tests: {
    skill: string
    tempValue: number // NaN 代表无
    cardEntry?: ICocCardEntry
    result?: IRollDecideResult
  }[]
}

export class StandardDiceRoll extends BasePtDiceRoll {

  protected times = 1
  hidden = false
  protected quiet = false
  protected vsFlag = false
  protected isAlias = false
  protected expression = ''

  // 当次请求检定的技能和临时值
  /*protected*/ readonly skillsForTest: { skill: string, tempValue: number }[] = []

  // 掷骰描述
  get description() {
    return this.skillsForTest.map(item => item.skill).join('，')
  }

  // 掷骰结果
  protected readonly rolls: IRollResult[] = []

  // side effects
  protected skills2growth: string[] = []

  override roll() {
    this.skills2growth.length = 0
    this.skillsForTest.length = 0
    this.rolls.length = 0
    this.parse()
    // 掷骰
    for (let i = 0; i < this.times; i++) {
      const roll = new DiceRoll(this.expression)
      this.rolls.push({
        roll,
        tests: this.skillsForTest.map(({ skill, tempValue }) => {
          const cardEntry = this.get(skill, tempValue) ?? undefined
          let result: IRollDecideResult | undefined = undefined
          if (cardEntry) {
            result = this.decide(roll.total, cardEntry)
            // 非临时值且检定成功，记录人物卡技能成长
            if (!cardEntry.isTemp && cardEntry.type === 'skills' && result?.success) {
              this.skills2growth.push(cardEntry.key)
            }
          }
          return { skill, tempValue, cardEntry, result }
        })
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
    console.log('[Dice] 原始指令', this.rawExpression, '|解析指令', this.expression, '|描述', JSON.stringify(this.skillsForTest), '|暗骰', this.hidden, '|省略', this.quiet, '|对抗', this.vsFlag, '|次数', this.times)
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
    const match = expression.match(/^(h|q|v|x\d+|\s)*/)
    if (match) {
      const flags = match[0]
      if (flags.includes('h')) this.hidden = true
      if (flags.includes('q')) this.quiet = true
      if (flags.includes('v')) this.vsFlag = true
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
    const { exp, skills } = parseDescriptions2(expression)
    // 如果是 alias dice，则认为 expression 已经由 config 指定，无视解析出的 exp
    if (this.isAlias) {
      this.skillsForTest.push(...skills)
      return
    }
    // 如果只有单独的一条 description，没有 exp，判断一下是否是直接调用人物卡的表达式
    // 例如【.徒手格斗】直接替换成【.1d3+$db】. 而【.$徒手格斗】走通用逻辑，求值后【.const】
    if (!exp && skills.length === 1 && isNaN(skills[0].tempValue)) {
      const ability = this.selfCard?.getAbility(skills[0].skill)
      if (ability) {
        this.expression = parseTemplate(ability.value, this.context, this.inlineRolls)
        this.skillsForTest.push(skills[0])
        return
      }
    }
    // 默认情况，分别代入即可
    this.expression = exp
    this.skillsForTest.push(...skills)
  }

  private detectDefaultRoll() {
    if (this.expression === '' || this.expression === 'd') {
      this.expression = this.defaultRoll
    }
  }

  override get output() {
    // 第一行
    const descriptionStr = this.description ? ' ' + this.description : '' // 避免 description 为空导致连续空格
    const headLine = `${this.context.username} 🎲${descriptionStr}`
    // 是否有中间骰
    const inlineRollLines = []
    if (this.hasInlineRolls && !this.quiet) {
      const inlineLines = this.inlineRolls.map((roll, i) => {
        return `${i === 0 ? '先是' : '然后' } ${roll.output}`
      })
      inlineRollLines.push(...inlineLines, '最后 🎲')
    }
    // 普通骰 [多轮掷骰][组合检定结果]
    const rollLines = this.rolls.map((rollResult) => {
      const roll = rollResult.roll
      // 掷骰过程
      const lines = [`${this.quiet ? `${roll.notation} = ${roll.total}` : roll.output}`]
      // 拼接检定结果
      if (rollResult.tests.length === 1) {
        // 单条描述或技能检定，直接拼在后面
        const testResult = rollResult.tests[0].result?.desc ?? ''
        lines[0] += ` ${testResult}`
      } else {
        // 组合技能检定，回显技能名，且过滤掉没有检定的行，减少冗余信息
        rollResult.tests.forEach(test => {
          const testResult = test.result?.desc ?? ''
          if (testResult) {
            lines.push(`${test.skill} ${roll.total} ${testResult}`)
          }
        })
      }
      return lines
    })
    // 组装结果，根据条件判断是否换行
    const lines = [headLine, ...inlineRollLines]
    if (rollLines.length === 1) {
      // 没有多轮投骰，将两个部分首位相连
      const lastLine = lines[lines.length - 1]
      const [first, ...rest] = rollLines[0]
      lines[lines.length - 1] = `${lastLine} ${first}`
      lines.push(...rest)
    } else {
      // 有多轮投骰，就简单按行显示
      lines.push(...rollLines.flat())
    }
    // 判断是否需要对抗标记
    if (this.vsFlag && this.eligibleForOpposedRoll) {
      lines.push('> 回复本条消息以进行对抗')
    }
    return lines.map(line => line.trim()).join('\n')
  }

  override applyToCard() {
    const card = this.selfCard
    if (!card) return []
    // const inlineSkills2growth = this.inlineRolls.map(inlineRoll => inlineRoll.skills2growth).flat()
    // const uniqSkills = Array.from(new Set([...inlineSkills2growth, ...this.skills2growth]))
    const uniqSkills = Array.from(new Set(this.skills2growth))
    let needUpdate = false
    // 如标记了对抗骰，则根据规则书不标记技能成长
    if (!this.vsFlag) {
      uniqSkills.forEach(skill => {
        const updated = card.markSkillGrowth(skill)
        needUpdate ||= updated
      })
    }
    return needUpdate ? [card] : []
  }

  // 是否可以用于对抗
  get eligibleForOpposedRoll() {
    if (this.hidden) return false
    // 单轮投骰 & 有且仅有一个技能检定 & 技能检定有结果
    return this.rolls.length === 1 && this.rolls[0].tests.length === 1 && !!this.rolls[0].tests[0].result
  }

  // 用于对抗检定的数据
  /* protected */ getSuccessLevelForOpposedRoll(refineSuccessLevels = true) {
    // eligibleForOpposedRoll 确保了 rollResult 和 test 有且仅有一个
    const rollResult = this.rolls[0]
    const test = rollResult.tests[0]
    // 组装对抗检定数据
    const rollValue = rollResult.roll.total
    const decideResult = test.result!
    const baseValue = test.cardEntry!.baseValue
    const res = { username: this.context.username, skill: test.cardEntry!.key, baseValue }
    if (decideResult.level === SuccessLevel.REGULAR_SUCCESS) {
      // 成功的检定，如设置 refineSuccessLevels，要比较成功等级哪个更高
      if (refineSuccessLevels && rollValue <= calculateTargetValueWithDifficulty(baseValue, 'ex')) {
        return Object.assign(res, { level: SuccessLevel.EX_SUCCESS })
      } else if (refineSuccessLevels && rollValue <= calculateTargetValueWithDifficulty(baseValue, 'hard')) {
        return Object.assign(res, { level: SuccessLevel.HARD_SUCCESS })
      } else {
        return Object.assign(res, { level: SuccessLevel.REGULAR_SUCCESS })
      }
    } else {
      return Object.assign(res, { level: decideResult.level })
    }
  }
}
