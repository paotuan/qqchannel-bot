import { BasePtDiceRoll } from '../../base'
import { at } from '../../utils'

// .st &徒手格斗 1d3+$db, &xxx=yyy
export class StAbilityDiceRoll extends BasePtDiceRoll {

  private readonly abilities: { name: string, value: string }[] = []

  override roll(): this {
    // 是否有人物卡，如没有直接结束
    if (!this.selfCard) return this
    const exp = this.rawExpression.slice(2).trim()
    this.rollSet(exp)
    return this
  }

  private get hasEditPermission() {
    return this.hasPermission(this.config.specialDice.stDice.writable)
  }

  private rollSet(exp: string) {
    const segments = exp.split(/[,，;；、]+/).map(segment => segment.trim()).filter(segment => !!segment)
    // 解析表达式
    segments.forEach(segment => {
      const [name, value] = splitSegment(segment)
      if (!name || !value) return
      this.abilities.push({ name, value })
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
    if (this.abilities.length === 0) {
      return this.t('roll.st.prompt', this.formatArgs)
    }
    const 条目列表 = this.abilities.map((item, i) => {
      return { 条目: `${item.name} ${item.value}`, last: i === this.abilities.length - 1 }
    })
    return this.t('roll.st.set', {
      ...this.formatArgs,
      条目列表,
      条目唯一: this.abilities.length === 1,
      条目: 条目列表[0],
    })
  }

  private get formatArgs() {
    return {
      目标人物卡名: this.selfCard?.name, // 仅用于兼容
      目标用户: at(this.context.userId), // 仅用于兼容
      st: true
    }
  }

  override applyToCard() {
    if (!this.hasEditPermission) return []
    if (!this.selfCard) return []
    if (this.abilities.length === 0) return []
    let modified = false
    this.abilities.forEach(item => {
      const b = this.selfCard!.setAbility(item.name, item.value)
      modified ||= b
    })
    return modified ? [this.selfCard] : []
  }
}

function splitSegment(segment: string) {
  // 去除开头可能有的 &
  if (segment.startsWith('&')) {
    segment = segment.slice(1)
  }
  // 如果有 = ，优先按照 = 分隔。这样可以支持 name 里面有特殊字符的情况
  const index = segment.indexOf('=')
  if (index >= 0) {
    const name = segment.slice(0, index).trim()
    const value = segment.slice(index + 1).trim()
    return [name, value]
  }
  // 如果没有 =，就按照空格或中英文分界线分隔
  const index2 = segment.search(/[^\p{Unified_Ideograph}]/u)
  if (index2 >= 0) {
    const name = segment.slice(0, index2).trim()
    const value = segment.slice(index2).trim()
    return [name, value]
  }
  return [segment]
}
