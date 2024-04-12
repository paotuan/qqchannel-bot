import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import {
  parseTemplate,
  parseDescriptions2,
  removeTrailingOneSpace,
  ParseFlagsAll,
  ParseFlags,
  TestRequest
} from '../utils'
import { BasePtDiceRoll } from '../index'
import type { IRollDecideResult } from '../../config/helpers/decider'
import type { ICardEntry } from '@paotuan/card'

interface IRollResult {
  roll: DiceRoll
  // 一次 roll 可能同时检定多个技能，也可能没有
  tests: {
    skill: string
    targetValue?: number // 目标值。coc：cardEntry.value / dnd: dc
    cardEntry?: ICardEntry
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
  /*protected*/ readonly skillsForTest: TestRequest[] = []

  // 掷骰描述
  get description() {
    return this.skillsForTest.map(item => item.skill).join('，')
  }

  // 掷骰结果
  protected readonly rolls: IRollResult[] = []

  /* final */ override roll() {
    this.parse()
    this.emitDiceRollEvent('BeforeDiceRoll') // mitt 看源码是同步调用的，应该没什么问题
    this.doRoll()
    this.emitDiceRollEvent('AfterDiceRoll')
    return this
  }

  protected doRoll() {
    // 掷骰。此处是 general 的实现，子类可基于不同的规则决定怎么使用这些解析出来的部分
    for (let i = 0; i < this.times; i++) {
      const roll = new DiceRoll(this.expression)
      this.rolls.push({
        roll,
        tests: this.skillsForTest.map(({ skill, tempValue, modifiedValue }) => {
          let cardEntry: ICardEntry | undefined
          // 如有临时值，则优先取临时值. 无临时值，则从人物卡读取
          if (!isNaN(tempValue)) {
            cardEntry = { input: skill, key: skill, value: tempValue, isTemp: true }
          } else {
            cardEntry = this.selfCard?.getEntry(skill)
          }
          // 如有 entry，则进行检定
          let targetValue: number | undefined
          let result: IRollDecideResult | undefined
          if (cardEntry) {
            targetValue = cardEntry.value + (modifiedValue || 0) // 如有调整值，则调整目标值
            result = this.decide({ baseValue: cardEntry.value, targetValue, roll: roll.total })
          }
          return { skill, targetValue, cardEntry, result }
        })
      })
    }
  }

  // 解析指令，最终结果存入 this.expression
  protected parse() {
    const removeAlias = this.parseAlias(this.rawExpression).trim()
    const removeR = removeAlias.startsWith('r') ? removeAlias.slice(1).trim() : removeAlias
    const removeFlags = this.parseFlags(removeR).trim()
    this.parseDescriptions(removeFlags)
    this.detectDefaultRoll()
    console.log('[Dice] 原始指令', this.rawExpression, '|解析指令', this.expression, '|描述', JSON.stringify(this.skillsForTest), '|暗骰', this.hidden, '|省略', this.quiet, '|对抗', this.vsFlag, '|次数', this.times)
  }

  // 解析别名指令
  private parseAlias(expression: string) {
    const parsed = this.context.config.parseAliasRoll_expression(expression, this.context, this.inlineRolls)
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
        this.times = Math.max(1, Math.min(100, times)) // 最多100连，至少一个
      }
      return expression.slice(flags.length)
    }
    return expression
  }

  protected parseDescriptions(expression: string) {
    // 如果是 alias dice，则 expression 已经在 parseAlias 中指定，剩下的内容都当成技能名和临时值来解析
    if (this.isAlias) {
      const { skills } = parseDescriptions2(expression, ParseFlagsAll ^ ParseFlags.PARSE_EXP)
      this.skillsForTest.push(...skills)
      return
    }
    // 正常流程解析
    const { exp, skills } = parseDescriptions2(expression)
    // 如果只有单独的一条 description，没有 exp，判断一下是否是直接调用人物卡的表达式
    // 例如【.徒手格斗】直接替换成【.1d3+$db】. 而【.$徒手格斗】走通用逻辑，求值后【.const】
    if (!exp && skills.length === 1 && isNaN(skills[0].tempValue) && isNaN(skills[0].modifiedValue)) {
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
    // 第一行 (Maca 🎲 侦察)
    const headLine = this.t('roll.start', this.getRollStartArgs())
    // 是否有中间骰
    const inlineRollLines = []
    if (this.hasInlineRolls && !this.quiet) {
      const inlineLines = this.inlineRolls.map((roll, i) => {
        return this.t(i === 0 ? 'roll.inline.first' : 'roll.inline.middle') + roll.output // 中间骰暂不提供 roll 作为 args，因为本身要和 inlineRoll.output 拼接
      })
      inlineRollLines.push(...inlineLines, this.t('roll.inline.last'))
    }
    // 普通骰 [多轮掷骰][组合检定结果]
    const rollLines = this.rolls.map((rollResult) => {
      const roll = rollResult.roll
      // 掷骰过程
      const lines = [this.t(this.quiet ? 'roll.result.quiet' : 'roll.result', this.getFormatArgs(roll))]
      // 拼接检定结果
      if (rollResult.tests.length === 1) {
        // 单条描述或技能检定，直接拼在后面
        const { tests: [test] } = rollResult
        const testResult = this.ts(test.result?.level, this.getFormatArgs(roll, test))
        lines[0] += testResult
      } else {
        // 组合技能检定，回显技能名，且过滤掉没有检定的行，减少冗余信息
        rollResult.tests.forEach(test => {
          const testResult = this.ts(test.result?.level, this.getFormatArgs(roll, test))
          if (testResult) {
            lines.push(`${test.skill} ${roll.total}${testResult}`)
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
      lines[lines.length - 1] = `${removeTrailingOneSpace(lastLine)} ${first}` // trim 以避免可能重复的空格
      lines.push(...rest)
    } else {
      // 有多轮投骰，就简单按行显示
      lines.push(...rollLines.flat())
    }
    // 判断是否需要对抗标记
    if (this.vsFlag && this.eligibleForOpposedRoll) {
      lines.push(this.t('roll.vs.prompt'))
    }
    return lines.map(line => line.trim()).join('\n')
  }

  // 是否可基于此骰进行对抗检定
  get eligibleForOpposedRoll() {
    return false
  }

  // roll.start 格式化参数
  protected getRollStartArgs() {
    // 需求区分检定和普通掷骰，根据是否有检定结果来判断
    const hasTest = this.rolls.some(roll => roll.tests.some(test => !!test.result))
    return {
      描述: this.description,
      原始指令: this.rawExpression,
      普通检定: hasTest,
      普通掷骰: !hasTest,
    }
  }

  // 技能检定格式化可提供参数
  protected getFormatArgs(roll: DiceRoll, test?: IRollResult['tests'][number]) {
    return {
      原始指令: this.rawExpression,
      描述: test?.skill,
      目标值: test?.targetValue,
      掷骰结果: roll.total,
      掷骰表达式: roll.notation,
      掷骰输出: roll.output
    }
  }
}
