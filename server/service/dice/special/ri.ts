import { BasePtDiceRoll } from '../index'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { parseDescriptions, ParseFlags, parseTemplate } from '../utils'
import type { IRiItem } from '../../../../interface/common'

// ri [1d20+1] [username],[1d20] [username]
// init
// init clr
export class RiDiceRoll extends BasePtDiceRoll {

  private readonly rolls: { type: 'actor' | 'npc', id: string, username?: string, roll: DiceRoll }[] = [] // username 用于展示

  private get notSupported() {
    return !this.context.channelId
  }

  override roll() {
    const removeRi = this.rawExpression.slice(2).trim()
    // 根据空格和中文区分出指令部分和名字部分
    const segments = removeRi.split(/[,，;；]+/).filter(segment => !!segment.trim())
    if (segments.length === 0) segments.push('') // push 一个空的代表自己
    console.log('[Dice] 先攻指令 原始指令', this.rawExpression)
    const baseRoll = this.context.config.specialDice.riDice.baseRoll.trim() || 'd20'
    segments.forEach(segment => {
      const [exp, desc] = parseDescriptions(segment, ParseFlags.PARSE_EXP)
      const expression = exp.startsWith('+') || exp.startsWith('-') ? `${baseRoll}${exp}` : (exp || baseRoll)
      const parsed = parseTemplate(expression, this.context, this.inlineRolls)
      const diceRoll = new DiceRoll(parsed)
      const type = desc ? 'npc' : 'actor'
      this.rolls.push({
        type,
        id: desc || this.context.userId,
        username: type === 'actor' ? this.context.username : undefined,
        roll: diceRoll
      })
    })
    return this
  }

  override get output() {
    return this.rolls.map(item => `${item.username || item.id} 🎲 先攻 ${item.roll.output}`).join('\n')
  }

  // ri 是走缓存，不走人物卡，不走 applyToCard 逻辑，自己处理了
  applyToRiList(riListCache: Record<string, IRiItem[]>) {
    if (this.notSupported) {
      console.warn('私信场景不支持先攻列表')
    } else {
      const list = riListCache[this.context.channelId!]
      this.rolls.forEach(item => {
        const exist = list.find(other => other.type === item.type && other.id === item.id)
        if (exist) {
          exist.seq = item.roll.total
          exist.seq2 = NaN
        } else {
          list.push({ type: item.type, id: item.id, seq: item.roll.total, seq2: NaN })
        }
      })
    }
  }
}

const AtUserPattern = /^<@!(\d+)>/
export class RiListDiceRoll extends BasePtDiceRoll {

  private clear = false
  private delList: { id: string, type: 'npc' | 'actor' }[] = []
  private riList?: IRiItem[]

  private get notSupported() {
    return !this.context.channelId
  }

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
    return this
  }

  private parseDelList(expression: string) {
    const atSelf = `<@!${this.context.userId}>`
    const delList = expression.trim().split(/[\s,，;；]+/).map(name => name || atSelf) // 没指定相当于自己的 userId
    const uniqList = Array.from(new Set(delList))
    const uniqDelList = uniqList.length > 0 ? uniqList : [atSelf]
    this.delList = uniqDelList.map(nameOrAt => {
      const userIdMatch = nameOrAt.match(AtUserPattern)
      if (userIdMatch) {
        return { id: userIdMatch[1], type: 'actor' }
      } else {
        return { id: nameOrAt, type: 'npc' }
      }
    })
  }

  applyToRiList(riListCache: Record<string, IRiItem[]>) {
    if (this.notSupported) {
      console.warn('私信场景不支持先攻列表')
    } else {
      // 先存一份列表，避免 apply 后清空，output 获取不到
      this.riList = [...riListCache[this.context.channelId!]]
      // 真正处理
      if (this.clear) {
        riListCache[this.context.channelId!] = []
      } else if (this.delList.length > 0) {
        const list = riListCache[this.context.channelId!]
        this.delList.forEach(({ id, type }) => {
          const index = list.findIndex(item => item.type === type && item.id === id)
          if (index >= 0) {
            list.splice(index, 1)
          }
        })
      }
    }
  }

  override get output() {
    if (!this.riList) {
      return '私信场景不支持先攻列表'
    }
    if (this.delList.length > 0) {
      const charaList = this.delList.map(item => getRiName(item.type, item.id))
      return `${this.context.username} 删除先攻：${charaList.join('，')}`
    } else {
      // 显示先攻列表
      const descList = this.riList
        .sort((a, b) => {
          const seq1Res = compareSeq(a.seq, b.seq)
          return seq1Res === 0 ? compareSeq(a.seq2, b.seq2) : seq1Res
        })
        .map((entry, i) => `${i + 1}. ${getRiName(entry.type, entry.id)} 🎲 ${entry.seq}${isNaN(entry.seq2) ? '' : `(${entry.seq2})`}`)
      const lines = ['当前先攻列表：', ...descList]
      if (this.clear) {
        lines.push('*先攻列表已清空')
      }
      return lines.join('\n')
    }
  }
}

// 先攻值比较
function compareSeq(a: number, b: number) {
  if (isNaN(a) && isNaN(b)) return 0
  if (isNaN(a)) return 1
  if (isNaN(b)) return -1
  return b - a
}

function getRiName(type: 'npc' | 'actor', id: string) {
  return type === 'npc' ? id : `<@!${id}>`
}
