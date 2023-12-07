import { BasePtDiceRoll } from '../../index'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { at, type IDiceRollContext, parseTemplate } from '../../utils'
import { DndCard } from '../../../../../interface/card/dnd'

// .st xx +1d6，yy -2，zz 20  // 根据逗号或分号分隔。不支持自动探测，因为骰子表达式情况比较复杂，难以判断。而且也要考虑技能名特殊字符的情况
// .st show xx,xx,xx
export class StDiceRoll extends BasePtDiceRoll {

  private readonly rolls: { name: string, roll: DiceRoll }[] = []

  override roll() {
    // 是否有人物卡，如没有直接结束
    if (!this.selfCard) return this
    const exp = this.rawExpression.slice(2).trim()
    this.rollSet(exp)
    return this
  }

  private get hasEditPermission() {
    const control = this.context.config.specialDice.stDice.writable
    const userRole = this.context.userRole
    if (control === 'none') {
      return false
    } else if (control === 'all') {
      return true
    } else { // manager
      return userRole !== 'user'
    }
  }

  private rollSet(exp: string) {
    const segments = exp.split(/[,，;；、]+/).filter(segment => !!segment.trim())
    // 解析表达式
    segments.forEach(segment => {
      // 根据空格、+、—、数字来分隔，满足大多数的情况
      const index = segment.search(/[\s+\-\d]/)
      if (index < 0) return
      let name = segment.slice(0, index).trim()
      const value = segment.slice(index).trim()
      if (!name || !value) return
      // 根据 value 拼装表达式
      // dnd 特殊处理，如果 st 的是技能，则重定向到技能修正值，以提供更符合直觉的体验
      if (this.selfCard instanceof DndCard) {
        const entry = this.selfCard.getEntry(name)
        if (entry && entry.type === 'skills' && entry.postfix === 'none') {
          name = `${name}修正`
        }
      }
      // dnd 特殊处理 end
      const baseValue = `\${${name}}`
      const expression = value.startsWith('+') || value.startsWith('-') ? `${baseValue}${value}` : value
      const parsed = parseTemplate(expression, this.context, this.inlineRolls)
      this.rolls.push({ name, roll: new DiceRoll(parsed) })
    })
  }

  override get output() {
    if (!this.selfCard) {
      return this.t('card.empty', this.formatArgs)
    }
    // 权限判断
    if (!this.hasEditPermission) {
      return this.t('card.nopermission', this.formatArgs)
    }
    if (this.rolls.length === 0) {
      return this.t('roll.st.prompt', this.formatArgs)
    } else {
      const 条目列表 = this.rolls.map((item, i) => {
        const rollOutput = this.t('roll.result', {
          ...this.formatArgs,
          掷骰结果: item.roll.total,
          掷骰表达式: item.roll.notation,
          掷骰输出: item.roll.output
        })
        return { 条目: `${item.name} ${rollOutput}`, last: i === this.rolls.length - 1 }
      })
      return this.t('roll.st.set', {
        ...this.formatArgs,
        条目列表,
        条目唯一: this.rolls.length === 1,
        条目: 条目列表[0],
      })
    }
  }

  private get formatArgs() {
    return {
      目标人物卡名: this.selfCard?.name, // 仅用于兼容
      目标用户: at(this.context.userId), // 仅用于兼容
      st: true
    }
  }

  override applyToCard() {
    if (!this.selfCard) return []
    if (this.rolls.length === 0) return []
    let modified = false
    this.rolls.forEach(item => {
      // const entry = this.targetUserCard!.getEntry(item.name)
      // const skillName = entry?.name || item.name
      const b = this.selfCard!.setEntry(item.name, item.roll.total)
      modified ||= b
    })
    return modified ? [this.selfCard] : []
  }
}
