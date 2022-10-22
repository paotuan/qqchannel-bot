import type { QApi } from './index'
import { makeAutoObservable } from 'mobx'
import { AvailableIntentsEventsEnum, IMessage } from 'qq-guild-bot'
import * as LRUCache from 'lru-cache'
import { PtDiceRoll } from '../dice'
import type { ICocCardEntry } from '../card/coc'

interface IMessageCache {
  text?: string
  instruction?: string | null // 文本消息是否包含指令。第一次使用时解析（undefined: 未解析，null：解析了但是为空）
}

export class DiceManager {
  private readonly api: QApi
  private get wss() { return this.api.wss }
  private readonly msgCache: LRUCache<string, IMessageCache>

  constructor(api: QApi) {
    makeAutoObservable<this, 'api' | 'wss'>(this, { api: false, wss: false })
    this.api = api
    this.msgCache = new LRUCache({
      max: 50,
      fetchMethod: async key => {
        const [channelId, msgId] = key.split('-')
        const { data } = await this.api.qqClient.messageApi.message(channelId, msgId)
        const text = data.message.content?.trim()
        return { text, instruction: text ? undefined : null } as IMessageCache // 非文本消息就直接记录为 null 了
      }
    })
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
    const username = msg.member.nick || msg.author.username || msg.author.id
    const res = this.tryRollDice(fullExp, { userId: msg.author.id, channelId: msg.channel_id, username })
    if (res) {
      // 拼装结果，并发消息
      const channel = this.api.guilds.findChannel(msg.channel_id, msg.guild_id)
      if (!channel) return // channel 信息不存在
      if (res.roll.hide) { // 处理暗骰
        const channelMsg = `${username} 在帷幕后面偷偷地 🎲 ${res.roll.description}，猜猜结果是什么`
        channel.sendMessage({content: channelMsg, msg_id: msg.id})
        const user = this.api.guilds.findUser(msg.author.id, msg.guild_id)
        if (!user) return // 用户信息不存在
        user.sendMessage({ content: res.reply, msg_id: msg.id }) // 似乎填 channel 的消息 id 也可以认为是被动
      } else {
        channel.sendMessage({ content: res.reply, msg_id: msg.id })
      }
    }
  }

  /**
   * 处理私信
   */
  private handleDirectMessage(msg: IMessage) {
    const userId = msg.author.id
    const srcGuildId = (msg as any).src_guild_id
    try {
      // 无视非文本消息
      const content = msg.content?.trim()
      if (!content) throw 'unknown message'

      // 提取出指令体，无视非指令消息
      let fullExp = '' // .d100 困难侦察
      if (content.startsWith('.') || content.startsWith('。')) {
        // 指令消息
        fullExp = content.substring(1).trim()
      }
      if (!fullExp) throw 'unknown message'
      // 转义 转义得放在 at 消息和 emoji 之类的后面
      fullExp = unescapeHTML(fullExp)

      // 投骰
      const user = this.api.guilds.findUser(userId, srcGuildId)
      if (!user) throw 'user not found'
      const res = this.tryRollDice(fullExp, { userId: msg.author.id, username: user.persona })
      if (res) {
        // 私信就不用考虑是不是暗骰了
        user.sendMessage({ content: res.reply, msg_id: msg.id }, msg.guild_id)
      } else throw 'unrecognized dice expression'
    } catch (e) {
      // 私信至少给个回复吧，不然私信机器人3条达到限制了就很尴尬
      const selfNick = this.api.botInfo?.username || ''
      const reply = `${selfNick}在的说`
      this.api.guilds.findUser(userId, srcGuildId)?.sendMessage({ content: reply, msg_id: msg.id }, msg.guild_id)
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
    const cacheMsg = await this.msgCache.fetch(`${channelId}-${msgId}`)
    if (!cacheMsg || cacheMsg.instruction === null) return
    if (typeof cacheMsg.instruction === 'undefined') {
      cacheMsg.instruction = detectInstruction(cacheMsg.text || '')
    }
    if (!cacheMsg.instruction) return
    const user = this.api.guilds.findUser(userId, guildId)
    const res = this.tryRollDice(`d% ${cacheMsg.instruction}`, { userId, channelId, username: user?.persona })
    if (res) {
      // 表情表态也没有暗骰
      const channel = this.api.guilds.findChannel(channelId, guildId)
      channel?.sendMessage({ content: res.reply, msg_id: eventId }) // 这里文档写用 event_id, 但其实要传 msg_id
    }
  }

  /**
   * 投骰
   * @param fullExp 指令表达式
   * @param userId 投骰用户的 id
   * @param channelId 投骰所在的子频道，选填。若存在子频道说明不是私信场景，会去判断人物卡数值
   * @param username 用户昵称，用于拼接结果字符串
   */
  private tryRollDice(fullExp: string, { userId, channelId, username }: { userId: string, channelId?: string, username?: string }) {
    try {
      // console.time('dice')
      // 是否有人物卡
      const cocCard = channelId ? this.wss.cards.getCard(channelId, userId) : null
      // 根据人物卡获取对应 name 的数值
      const skillName2entryCache: Record<string, ICocCardEntry | null> = {} // 单次投骰过程中 getEntry 增加缓存，避免连续骰多次调用
      const getEntry = (key: string) => {
        if (!cocCard) return null
        if (typeof skillName2entryCache[key] === 'undefined') {
          skillName2entryCache[key] = cocCard.getEntry(key)
        }
        return skillName2entryCache[key]
      }
      // 投骰
      const roll = PtDiceRoll.fromTemplate(fullExp, (key) => getEntry(key)?.value || '')
      let cardNeedUpdate = false // 标记是否有技能成长导致人物卡更新。因为投骰过程中可能涉及到多次更新，延后到全部计算完后再写文件保存
      const reply = roll.format(username || userId, {}, (desc, value) => {
        const cardEntry = getEntry(desc)
        if (cardEntry) {
          const testResult = this.decideResult(cardEntry, value)
          if (testResult.success && cardEntry.type === 'skills') { // 注意只有技能类型才能成长
            const updated = cocCard?.markSkillGrowth(cardEntry.name) || false
            cardNeedUpdate ||= updated // 不能跟上面一句短路，因为 markSkillGrowth 有副作用，必须确保调用到
          }
          return testResult.desc
        } else {
          return ''
        }
      })
      // 保存人物卡更新
      if (cocCard && cardNeedUpdate) {
        this.wss.cards.saveCard(cocCard)
      }
      return { roll, reply }
    } catch (e: any) {
      // 表达式不合法，无视之
      console.log('[Dice] 未识别表达式', e?.message)
      return null
    } finally {
      // console.timeEnd('dice')
    }
  }

  // todo 规则自定义
  private decideResult(cardEntry: ICocCardEntry, roll: number) {
    if (roll === 1) {
      return { success: true, desc: '大成功' }
    } else if (roll > 95) {
      return { success: false, desc: '大失败' }
    } else if (roll <= cardEntry.value) {
      return { success: true, desc: `≤ ${cardEntry.value} 成功` }
    } else {
      return { success: false, desc: `> ${cardEntry.value} 失败` }
    }
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
      console.log(`[QApi][表情表态事件][${data.eventType}]`)
      switch (data.eventType) {
      case 'MESSAGE_REACTION_ADD':
        this.handleGuildReactions(data.eventId, data.msg)
        break
      default:
        break
      }
    })
    this.api.on(AvailableIntentsEventsEnum.DIRECT_MESSAGE, (data: any) => {
      console.log(`[QApi][私信事件][${data.eventType}]`)
      switch (data.eventType) {
      case 'DIRECT_MESSAGE_CREATE':
        this.handleDirectMessage(data.msg as IMessage)
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
