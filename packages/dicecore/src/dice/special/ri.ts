import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import { BasePtDiceRoll } from '../base'
import { at, AtUserPattern } from '../utils'
import { parseDescriptions, ParseFlags } from '../utils/parseDescription'
import { parseTemplate } from '../utils/parseTemplate'
import { RiProvider } from '../../ri/ri-provider'

// ri [1d20+1] [username],[1d20] [username]
// init
// init clr
export class RiDiceRoll extends BasePtDiceRoll {

  private readonly rolls: { type: 'actor' | 'npc', id: string, username: string, roll: DiceRoll }[] = [] // username 用于展示

  override roll() {
    const removeRi = this.rawExpression.slice(2).trim()
    // 根据空格和中文区分出指令部分和名字部分
    const segments = removeRi.split(/[,，;；]+/).filter(segment => !!segment.trim())
    if (segments.length === 0) segments.push('') // push 一个空的代表自己
    console.log('[Dice] 先攻指令 原始指令', this.rawExpression)
    // const defaultRoll = this.context.config.specialDice.riDice.baseRoll.trim() || 'd20' 干掉先攻默认骰，统一走人物卡的配置
    segments.forEach(segment => {
      const [exp, desc] = parseDescriptions(segment, ParseFlags.PARSE_EXP)
      const type = desc ? 'npc' : 'actor'
      // 如果是骰玩家自己，且包含了人物卡，则优先读取人物卡的先攻默认骰
      const baseRoll = (type === 'actor' ? this.selfCard?.riDefaultRoll : undefined) ?? 'd20'
      const expression = exp.startsWith('+') || exp.startsWith('-') ? `${baseRoll}${exp}` : (exp || baseRoll)
      const parsed = parseTemplate(expression, this.context, this.inlineRolls)
      const diceRoll = new DiceRoll(parsed)
      this.rolls.push({
        type,
        id: desc || this.context.userId,
        username: type === 'actor' ? this.context.username : desc,
        roll: diceRoll
      })
    })
    return this
  }

  override get output() {
    return this.rolls.map(item => {
      const args = {
        // ri 不一定是自己，且要区分玩家与 npc
        用户名: item.username || item.id,
        人物卡名: this.selfCard?.name ?? (item.username || item.id),
        at用户: RiProvider.INSTANCE.getRiName(item),
        原始指令: this.rawExpression,
        描述: '先攻',
        掷骰结果: item.roll.total,
        掷骰表达式: item.roll.notation,
        掷骰输出: item.roll.output,
        ri: true
      }
      const head = this.t('roll.start', args)
      const desc = this.t('roll.result', args)
      return `${head} ${desc}`
    }).join('\n')
  }

  applyToCard() {
    RiProvider.INSTANCE.updateRiList(this.context.channelUnionId, this.rolls.map(item => ({
      type: item.type,
      id: item.id,
      name: item.username,
      seq: item.roll.total,
      seq2: NaN
    })))
    return []
  }
}

export class RiListDiceRoll extends BasePtDiceRoll {

  private clear = false
  private delList: { id: string, type: 'npc' | 'actor' }[] = []
  private riListDescription = ''

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
    const atSelf = at(this.context.userId)
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

  applyToCard() {
    // 先存一份列表，避免 apply 后清空，output 获取不到
    this.riListDescription = RiProvider.INSTANCE.getDescription(this.context.channelUnionId)
    // 真正处理
    if (this.clear) {
      RiProvider.INSTANCE.clearRiList(this.context.channelUnionId)
    } else if (this.delList.length > 0) {
      RiProvider.INSTANCE.updateRiList(this.context.channelUnionId, this.delList)
    }
    return []
  }

  override get output() {
    if (this.delList.length > 0) {
      const charaList = this.delList.map(item => RiProvider.INSTANCE.getRiName(item))
      return this.t('roll.ri.del', {
        人物列表: charaList.map((人物名, i) => ({ 人物名, last: i === charaList.length - 1 })),
        人物唯一: charaList.length === 0,
        人物名: charaList[0]
      })
    } else {
      // 显示先攻列表
      let listDesc = this.riListDescription
      if (this.clear) {
        listDesc += '\n' + this.t('roll.ri.clear')
      }
      return listDesc
    }
  }
}
