import type { QApi } from './index'
import { makeAutoObservable } from 'mobx'
import { AvailableIntentsEventsEnum, IMessage, MessageToCreate } from 'qq-guild-bot'
import type { ICard, ICardTestResp } from '../../../interface/common'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'

export class DiceManager {
  private readonly api: QApi
  private get wss() { return this.api.wss }

  constructor(api: QApi) {
    makeAutoObservable<this, 'api' | 'wss'>(this, { api: false, wss: false })
    this.api = api
    this.initListeners()
  }

  /**
   * 处理子频道骰子指令
   */
  private handleGuildMessage(msg: IMessage) {
    // 无视非文本消息
    const content = msg.content?.trim()
    if (!content) return

    // 提取出指令体，无视非指令消息
    const botUserId = this.api.botInfo?.id
    let fullExp = '' // .d100 困难侦察
    if (content.startsWith(`<@!${botUserId}> `)) {
      // @机器人的消息
      fullExp = content.replace(`<@!${botUserId}> `, '').trim()
    } else if (content.startsWith('.') || content.startsWith('。')) {
      // 指令消息
      fullExp = content.substring(1).trim()
    }
    if (!fullExp) return
    // 转义 转义得放在 at 消息和 emoji 之类的后面
    fullExp = unescapeHTML(fullExp)

    // 投骰
    const reply = this.tryRollDice(fullExp, {
      userId: msg.author.id,
      nickname: msg.member.nick || msg.author.username,
      channelId: msg.channel_id
    })
    if (reply) {
      this.sendDiceMessage(msg.channel_id, { content: reply, msg_id: msg.id })
    }
  }

  /**
   * 处理表情表态快速投骰
   */
  private async handleGuildReactions(eventId: string, reaction: any) {
    const channelId = reaction.channel_id as string
    const guildId = reaction.guild_id as string
    const msgId = reaction.target.id as string
    const userId = reaction.user_id as string
    // 获取原始消息
    const { data } = await this.api.qqClient.messageApi.message(channelId, msgId)
    const content = data.message.content?.trim()
    if (!content) return
    const instr = detectInstruction(content)
    if (!instr) return
    const reply = this.tryRollDice(`d% ${instr}`, { userId, channelId, guildId })
    if (reply) {
      this.sendDiceMessage(channelId, { content: reply, msg_id: eventId }) // 这里文档写用 event_id, 但其实要传 msg_id
    }
  }

  /**
   * 投骰
   * @param fullExp 指令表达式
   * @param msg 原始消息
   */
  private tryRollDice(fullExp: string, { userId, nickname, channelId, guildId }: { userId: string, nickname?: string, channelId: string, guildId?: string }) {
    // 如果没传 nickname 但传了 guildId，就根据 guild 的 user 列表去取 username
    if (!nickname && guildId) {
      const user = this.api.guilds.find(guildId)?.findUser(userId)
      if (user) {
        nickname = user.nick || user.username
      }
    }
    try {
      const [exp, desc = ''] = parseFullExp(fullExp)
      console.log('[Dice] 原始指令：', fullExp, '解析指令：', exp, '描述：', desc)
      const roll = new DiceRoll(exp)
      // 判断成功等级
      const result = this.decideResult(channelId, userId, desc, roll.total)
      if (result?.resultDesc?.endsWith('成功')) {
        // 成功的技能检定返回客户端。这么判断有点丑陋不过先这样吧
        this.wss.sendToChannel<ICardTestResp>(channelId, {
          cmd: 'card/test',
          success: true,
          data: { cardName: result!.cardName, success: true, propOrSkill: result!.skill }
        })
      }
      // 返回结果
      return `${nickname || userId} 🎲 ${desc} ${roll.output} ${result?.resultDesc || ''}`
    } catch (e) {
      // 表达式不合法，无视之
      return null
    }
  }

  private decideResult(channel: string, sender: string, desc: string, roll: number) {
    let skill = desc.trim()
    let resultDesc = ''
    // 0. 判断有没有描述
    if (!skill) return null
    // 1. 判断有没有人物卡
    const card = this.wss.cards.getCard(channel, sender)
    if (!card) return null
    // 2. 判断有没有对应的技能
    //   2.1 先判断几个特殊的
    if (skill === '理智' || skill === 'sc' || skill === 'SC') {
      resultDesc = roll <= card.basic.san ? `≤ ${card.basic.san} 成功` : `> ${card.basic.san} 失败`
    } else if (skill === '幸运') {
      resultDesc = roll <= card.basic.luck ? `≤ ${card.basic.luck} 成功` : `> ${card.basic.luck} 失败`
    } else if (skill === '灵感') {
      resultDesc = roll <= card.props['智力'] ? `≤ ${card.props['智力']} 成功` : `> ${card.props['智力']} 失败`
    } else {
      //   2.2 判断难度等级
      const isHard = skill.indexOf('困难') >= 0
      const isEx = skill.indexOf('极难') >= 0 || skill.indexOf('极限') >= 0
      skill = skill.replace(/(困难|极难|极限)/g, '')
      if (skill === '侦查') skill = '侦察' // 人物卡模版里的是后者
      let target = card.props[skill as keyof ICard['props']] || card.skills[skill]
      if (!target) return null // 没有技能。技能值为 0 应该也不可能
      // 3. 判断大成功大失败
      if (roll === 1) {
        resultDesc = '大成功'
      } else if (roll > 95) {
        resultDesc = '大失败'
      } else {
        // 4. 真实比较
        target = isEx ? Math.floor(target / 5) : (isHard ? Math.floor(target / 2) : target)
        resultDesc = roll <= target ? `≤ ${target} 成功` : `> ${target} 失败`
      }
    }
    // extra. 如果技能成功了，返回成功的技能名字，用来给前端自动高亮
    return { resultDesc, skill, cardName: card.basic.name }
  }

  private sendDiceMessage(channelId: string, msg: MessageToCreate) {
    this.api.qqClient.messageApi.postMessage(channelId, msg).then((res) => {
      console.log('[Dice] 发送成功 ' + msg.content)
      // 自己发的消息要记录 log
      this.api.logs.pushToClients(channelId, {
        msgId: res.data.id,
        msgType: 'text',
        userId: this.api.botInfo?.id || '',
        username: this.api.botInfo?.username || '',
        content: msg.content!,
        timestamp: res.data.timestamp
      })
    }).catch((err) => {
      console.error(err)
    })
  }

  private initListeners() {
    this.api.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, (data: any) => {
      if (this.filtered(data.msg.channel_id)) return
      switch (data.eventType) {
      case 'MESSAGE_CREATE':
        this.handleGuildMessage(data.msg as IMessage)
        break
      case 'MESSAGE_DELETE':
        break
      }
    })
    this.api.on(AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS, (data: any) => {
      if (this.filtered(data.msg.channel_id)) return
      switch (data.eventType) {
      case 'MESSAGE_REACTION_ADD':
        this.handleGuildReactions(data.eventId, data.msg)
        break
      default:
        break
      }
    })
  }

  private filtered(channelId: string) {
    return !this.wss.listeningChannels.includes(channelId)
  }
}

// 提取指令为 [骰子表达式, 描述]
function parseFullExp(fullExp: string): [string, string] {
  // sc 简写
  if (fullExp === 'sc' || fullExp === 'SC') {
    return ['d%', 'sc']
  }
  const index = fullExp.search(/[\p{Unified_Ideograph}\s]/u) // 按第一个中文或空格分割
  const [exp, desc = ''] = index < 0 ? [fullExp] : [fullExp.slice(0, index), fullExp.slice(index)]
  // 兼容一些其他指令
  // 默认骰，目前写死是 d100
  if (exp === 'd' || exp === 'r' || exp === 'rd') {
    return ['d%', desc]
  }
  // coc 技能骰
  if (exp === 'ra') {
    return ['d%', desc]
  }

  // rb 奖励骰、rd 惩罚骰
  const rbrpMatch = exp.match(/^r([bp])\s*(\d+)?$/)
  if (rbrpMatch) {
    const type = rbrpMatch[1] === 'b' ? 'l' : 'h'
    const count = parseInt(rbrpMatch[2] || '1', 10) // 默认一个奖励/惩罚骰
    return [`${count + 1}d%k${type}1`, desc]
  }

  // ww3a9: 3d10, >=9 则重投，计算骰子 >=8 的个数
  const wwMatch = exp.match(/^w{1,2}\s*(\d+)\s*a?\s*(\d+)*$/)
  if (wwMatch) {
    const diceCount = parseInt(wwMatch[1], 10)
    const explodeCount = parseInt(wwMatch[2] || '10', 10) // 默认达到 10 重投
    return [`${diceCount}d10!>=${explodeCount}>=8`, desc]
  }

  // 'rd100' / 'r d100' => d100s
  if (exp.startsWith('r')) {
    return [exp.slice(1).trim(), desc]
  }
  return [exp, desc]
}

const instRegex = new RegExp('(力量|体质|体型|敏捷|外貌|智力|灵感|意志|教育|理智|幸运|会计|人类学|估价|考古学|魅惑|攀爬|计算机|信用|克苏鲁神话|乔装|闪避|驾驶|电气维修|电子学|话术|格斗|射击|急救|历史|恐吓|跳跃|母语|法律|图书馆|聆听|锁匠|机械维修|医学|博物学|领航|神秘学|重型机械|说服|精神分析|心理学|骑术|妙手|侦查|侦察|潜行|游泳|投掷|追踪|sc|SC)', 'g')

// 判断文本中有没有包含指令
function detectInstruction(text: string) {
  const skillMatch = text.match(instRegex)
  if (!skillMatch) return null
  const skill = skillMatch[0]
  const difficultyMatch = text.match(/(困难|极难|极限)/)
  const difficulty = difficultyMatch ? difficultyMatch[0] : ''
  return difficulty + skill
}

// https://www.zhangxinxu.com/wordpress/2021/01/dom-api-html-encode-decode/
function unescapeHTML(str: string) {
  return str.replace(/&lt;|&gt;|&amp;/g, function (matches) {
    return ({
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&'
    })[matches] || ''
  })
}
