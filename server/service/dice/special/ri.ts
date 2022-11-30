import { BasePtDiceRoll } from '../index'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { parseDescriptions, ParseFlags, parseTemplate } from '../utils'

type RiList = Record<string, DiceRoll>
const Channel2RiMap: Record<string, RiList> = {}  // channelId => RiList

function getRiList(channelId: string) {
  if (!Channel2RiMap[channelId]) {
    Channel2RiMap[channelId] = {}
  }
  return Channel2RiMap[channelId]
}

// ri [1d20+1] [username],[1d20] [username]
// init
// init clr
export class RiDiceRoll extends BasePtDiceRoll {

  private readonly rolls: { name: string, roll: DiceRoll }[] = []

  private get notSupported() {
    return !this.context.channelId
  }

  override roll() {
    const removeRi = this.rawExpression.slice(2).trim()
    // 根据空格和中文区分出指令部分和名字部分
    const segments = removeRi.split(/[,，;；]+/).filter(segment => !!segment.trim())
    if (segments.length === 0) segments.push('') // push 一个空的代表自己
    console.log('[Dice] 先攻指令 原始指令', this.rawExpression)
    const baseRoll = this.context.config?.specialDice.riDice.baseRoll.trim() || 'd20'
    segments.forEach(segment => {
      const [exp, desc] = parseDescriptions(segment, ParseFlags.PARSE_EXP)
      const expression = exp.startsWith('+') || exp.startsWith('-') ? `${baseRoll}${exp}` : (exp || baseRoll)
      const parsed = parseTemplate(expression, this.context, this.inlineRolls)
      const diceRoll = new DiceRoll(parsed)
      this.rolls.push({ name: desc || this.context.username, roll: diceRoll })
    })
    this.apply()
    return this
  }

  override get output() {
    return this.rolls.map(item => `${item.name} 🎲 先攻 ${item.roll.output}`).join('\n')
  }

  // ri 是走缓存，不走人物卡，不走 applyToCard 逻辑，自己处理了
  private apply() {
    if (this.notSupported) {
      console.warn('私信场景不支持先攻列表')
    } else {
      const list = getRiList(this.context.channelId!)
      this.rolls.forEach(item => {
        list[item.name] = item.roll
      })
    }
  }
}

export class RiListDiceRoll extends BasePtDiceRoll {

  private clear = false
  private delList: string[] = []
  private riList?: RiList

  override roll() {
    // init 其实是个普通指令，不是骰子，有固定格式，所以就不考虑复杂的一些情况了，也没意义
    const removeInit = this.rawExpression.slice(4).trim()
    if (removeInit === 'clear' || removeInit === 'clr') {
      this.clear = true
    } else if (removeInit.startsWith('del')) {
      this.parseDelList(removeInit.slice(3))
    } else if (removeInit.startsWith('rm')) {
      this.parseDelList(removeInit.slice(2))
    }
    console.log('[Dice] 先攻列表 原始指令', this.rawExpression)
    // 先存一份列表，避免 apply 后清空，output 获取不到
    if (this.context.channelId) {
      this.riList = getRiList(this.context.channelId)
    }
    this.apply()
    return this
  }

  private parseDelList(expression: string) {
    const delList = expression.trim().split(/[\s,，;；]+/).map(name => name || this.context.username) // 没指定相当于自己的 username
    const uniqList = Array.from(new Set(delList))
    this.delList = uniqList.length > 0 ? uniqList : [this.context.username]
  }

  override get output() {
    if (!this.riList) {
      return '私信场景不支持先攻列表'
    }
    if (this.delList.length > 0) {
      return `${this.context.username} 删除先攻：${this.delList.join('，')}`
    } else {
      // 显示先攻列表
      const descList = Object.entries(this.riList)
        .sort((user1, user2) => user2[1].total - user1[1].total)
        .map((entry, i) => `${i + 1}. ${entry[0]} 🎲 ${entry[1].output}`)
      const lines = ['当前先攻列表：', ...descList]
      if (this.clear) {
        lines.push('*先攻列表已清空')
      }
      return lines.join('\n')
    }
  }

  private apply() {
    if (!this.context.channelId) {
      console.warn('私信场景不支持先攻列表')
      return
    }
    if (this.clear) {
      Channel2RiMap[this.context.channelId] = {}
    } else if (this.delList.length > 0) {
      const list = getRiList(this.context.channelId)
      this.delList.forEach(name => {
        delete list[name]
      })
    }
  }
}
