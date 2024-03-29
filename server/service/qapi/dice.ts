import type { QApi } from './index'
import { makeAutoObservable } from 'mobx'
import type { IMessage } from 'qq-guild-bot'
import LRUCache from 'lru-cache'
import { createDiceRoll } from '../dice/utils'
import { StandardDiceRoll } from '../dice/standard'
import { unescapeHTML } from '../../utils'
import type { IRiItem, IDiceRollReq } from '../../../interface/common'
import { RiDiceRoll, RiListDiceRoll } from '../dice/special/ri'
import type { UserRole, ParseUserCommandResult, IUserCommandContext } from '../../../interface/config'
import { createCard } from '../../../interface/card'
import { DiceRollContext } from '../DiceRollContext'
import mitt from 'mitt'
import type { BasePtDiceRoll } from '../dice'

interface IMessageCache {
  text?: string
  instruction?: string | null // 文本消息是否包含指令。第一次使用时解析（undefined: 未解析，null：解析了但是为空）
}

export class DiceManager {
  private readonly api: QApi
  private get wss() { return this.api.wss }
  private readonly msgCache: LRUCache<string, IMessageCache>
  private readonly opposedRollCache: LRUCache<string, StandardDiceRoll> // 对抗检定缓存 msgid => roll
  private readonly riListCache: Record<string, IRiItem[]> // 先攻列表缓存 channelId => ri list
  // 掷骰事件相关
  private readonly emitter = mitt<{ BeforeDiceRoll: BasePtDiceRoll, AfterDiceRoll: BasePtDiceRoll }>()
  private readonly beforeDiceRollListener = (roll: BasePtDiceRoll) => this.emitter.emit('BeforeDiceRoll', roll)
  private readonly afterDiceRollListener = (roll: BasePtDiceRoll) => this.emitter.emit('AfterDiceRoll', roll)

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
    this.opposedRollCache = new LRUCache({ max: 50 })
    this.riListCache = {}
    this.initListeners()
  }

  /**
   * 处理子频道骰子指令
   */
  private async handleGuildMessage({ command, context }: ParseUserCommandResult) {
    // 投骰
    const roll = this.tryRollDice(command, context)
    if (roll) {
      // 拼装结果，并发消息
      const channel = this.api.guilds.findChannel(context.channelId, context.guildId)
      if (!channel) return true // channel 信息不存在
      if (roll instanceof StandardDiceRoll && roll.hidden) { // 处理暗骰
        const channelMsg = roll.t('roll.hidden', { 描述: roll.description })
        channel.sendMessage({ content: channelMsg, msg_id: context.msgId })
        const user = this.api.guilds.findUser(context.realUser.userId, context.guildId) // 暗骰始终发送给消息发送人，不考虑代骰
        if (!user) return true // 用户信息不存在
        user.sendMessage({ content: roll.output, msg_id: context.msgId }) // 似乎填 channel 的消息 id 也可以认为是被动
      } else {
        const replyMsg = await channel.sendMessage({ content: roll.output, msg_id: context.msgId })
        // 如果是可供对抗的投骰，记录下缓存
        if (replyMsg && roll instanceof StandardDiceRoll && roll.eligibleForOpposedRoll) {
          this.opposedRollCache.set(replyMsg.id, roll)
        }
      }
    }
    return true
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
      const roll = this.tryRollDice(fullExp, { userId: msg.author.id, username: user.persona })
      if (roll) {
        // 私信就不用考虑是不是暗骰了
        user.sendMessage({ content: roll.output, msg_id: msg.id }, msg.guild_id)
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
  private async handleGuildReactions({ msgId: eventId, channelId, guildId, replyMsgId: msgId, userId, username, userRole }: IUserCommandContext) {
    // 获取原始消息
    const cacheMsg = await this.msgCache.fetch(`${channelId}-${msgId}`)
    if (!cacheMsg || cacheMsg.instruction === null) return
    if (typeof cacheMsg.instruction === 'undefined') {
      cacheMsg.instruction = detectInstruction(cacheMsg.text || '')
    }
    if (!cacheMsg.instruction) return
    const roll = this.tryRollDice(cacheMsg.instruction, { userId, guildId, channelId, username, userRole })
    if (roll) {
      // 表情表态也没有暗骰
      const channel = this.api.guilds.findChannel(channelId, guildId)
      if (!channel) return // channel 信息不存在
      const replyMsg = await channel.sendMessage({ content: roll.output, msg_id: eventId }) // 这里文档写用 event_id, 但其实要传 msg_id
      // 如果是可供对抗的投骰，记录下缓存
      if (replyMsg && roll instanceof StandardDiceRoll && roll.eligibleForOpposedRoll) {
        this.opposedRollCache.set(replyMsg.id, roll)
      }
    }
  }

  /**
   * 投骰
   * @param fullExp 指令表达式
   * @param userId 投骰用户的 id
   * @param guildId 投骰所在的频道，选填
   * @param channelId 投骰所在的子频道，选填。若存在子频道说明不是私信场景，会去判断人物卡数值
   * @param username 用户昵称，用于拼接结果字符串
   * @param replyMsgId 回复的消息 id，选填，用于区分通过回复进行的对抗检定
   * @param userRole 用户权限。目前仅用于 st dice 的权限控制
   */
  private tryRollDice(fullExp: string, { userId, guildId, channelId, username, replyMsgId, userRole }: { userId: string, guildId?: string, channelId?: string, username: string, replyMsgId?: string, userRole?: UserRole }) {
    try {
      // console.time('dice')
      // 是否有回复消息(目前仅用于对抗检定)
      const opposedRoll = replyMsgId ? this.opposedRollCache.get(replyMsgId) : undefined
      // 投骰
      const roller = createDiceRoll(
        fullExp,
        new DiceRollContext(this.api, { guildId, channelId, userId, username, userRole, opposedRoll }),
        { before: this.beforeDiceRollListener, after: this.afterDiceRollListener }
      )
      // 保存人物卡更新
      const updatedCards = roller.applyToCard()
      updatedCards.forEach(card => {
        this.wss.cards.saveCard(card)
      })
      // 特殊：保存先攻列表
      if (roller instanceof RiDiceRoll || roller instanceof RiListDiceRoll) {
        roller.applyToRiList(this.riListCache)
      }
      return roller
    } catch (e: any) {
      // 表达式不合法，无视之
      console.log('[Dice] 未识别表达式', e?.message)
      return null
    } finally {
      // console.timeEnd('dice')
    }
  }

  /**
   * 获取某个子频道先攻列表
   */
  getRiListOfChannel(channelId: string) {
    if (!this.riListCache[channelId]) {
      this.riListCache[channelId] = []
    }
    return this.riListCache[channelId]
  }

  /**
   * 从网页端手动发起代骰，如错误则返回错误信息
   */
  async manualDiceRollFromWeb(channelId: string, guildId: string, { expression, cardData }: IDiceRollReq) {
    try {
      const config = this.wss.config.getChannelConfig(channelId)
      // 1. 投骰
      const systemUserId = config.botOwner || 'system'
      const systemCard = createCard(cardData)
      const getCard = (userId: string) => userId === systemUserId ? systemCard : this.wss.cards.getCard(channelId, userId)
      // 网页代骰暂不支持人物卡操作。毕竟网页代骰是等于绑定了自己人物卡的
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const linkCard = () => {}
      const queryCard = () => []
      const roll = createDiceRoll(
        expression,
        { botId: this.api.appid, guildId, channelId, userId: systemUserId, username: cardData.name, userRole: 'admin', config, getCard, linkCard, queryCard },
        { before: this.beforeDiceRollListener, after: this.afterDiceRollListener }
      )
      // 代骰如果有副作用，目前也不持久化到卡上（毕竟现在主场景是从战斗面板发起，本来卡也不会持久化）
      // 特殊：保存先攻列表会把这个人当成玩家，目前也先不能保存
      // if (roller instanceof RiDiceRoll || roller instanceof RiListDiceRoll) {
      //   roller.applyToRiList(this.riListCache)
      // }
      // 2. 发消息
      const channel = this.api.guilds.findChannel(channelId, guildId)
      if (!channel) throw new Error('频道不存在')
      if (roll instanceof StandardDiceRoll && roll.hidden && config.botOwner) { // 如果设置了 botOwner, 则可以处理暗骰
        const channelMsg = roll.t('roll.hidden', { 描述: roll.description })
        channel.sendMessage({ content: channelMsg })
        const user = this.api.guilds.findUser(config.botOwner, guildId)
        if (!user) throw new Error('用户信息不存在')
        user.sendMessage({ content: roll.output })
      } else {
        const replyMsg = await channel.sendMessage({ content: roll.output })
        // 如果是可供对抗的投骰，记录下缓存
        if (replyMsg && roll instanceof StandardDiceRoll && roll.eligibleForOpposedRoll) {
          this.opposedRollCache.set(replyMsg.id, roll)
        }
      }
      return ''
    } catch (e: any) {
      console.log('[Dice] 网页端发起投骰失败', e?.message)
      return '掷骰失败：' + (e?.message ?? '')
    }
  }

  private initListeners() {
    this.api.onGuildCommand(async (data) => {
      return await this.handleGuildMessage(data)
    })
    this.api.onMessageReaction(async (context) => {
      this.handleGuildReactions(context)
      return false
    })
    this.api.onDirectMessage(async (data: any) => {
      this.handleDirectMessage(data.msg as IMessage)
      return false
    })
  }

  addDiceRollListener(type: 'BeforeDiceRoll' | 'AfterDiceRoll', listener: (roll: BasePtDiceRoll) => void) {
    this.emitter.on(type, listener)
  }

  removeDiceRollListener(type: 'BeforeDiceRoll' | 'AfterDiceRoll', listener: (roll: BasePtDiceRoll) => void) {
    this.emitter.off(type, listener)
  }
}

const ATTRIBUTE_REGEX = new RegExp('(力量|体质|体型|敏捷|外貌|智力|灵感|意志|教育|知识|理智|幸运|运气|会计|人类学|估价|考古学|魅惑|攀爬|计算机|电脑|信用|信誉|克苏鲁|乔装|闪避|驾驶|汽车|电气维修|电子学|话术|格斗|射击|急救|历史|恐吓|跳跃|母语|法律|图书馆|聆听|锁匠|开锁|撬锁|机械维修|医学|博物学|领航|导航|神秘学|重型|说服|精神分析|心理学|骑术|妙手|侦查|侦察|潜行|游泳|投掷|追踪|sc|SC|感知|魅力|运动|体操|巧手|隐匿|奥秘|调查|自然|宗教|驯兽|洞悉|医疗|察觉|生存|求生|欺瞒|威吓|表演|游说|医药)', 'g')
const DIFFICULTY_REGEX = /(困难|极难|极限)/
const INST_WRAPPER_REGEX = /【(.+)】/

// 判断文本中有没有包含指令
function detectInstruction(text: string) {
  // 1. 是否包含【...】
  const fullInstMatch = text.match(INST_WRAPPER_REGEX)
  if (fullInstMatch) {
    return fullInstMatch[1]
  }
  // 2. 是否包含常用属性/技能名
  const skillMatch = text.match(ATTRIBUTE_REGEX)
  if (skillMatch) {
    const skill = skillMatch[0]
    const difficultyMatch = text.match(DIFFICULTY_REGEX)
    const difficulty = difficultyMatch ? difficultyMatch[0] : ''
    return difficulty + skill // 拼装检定表达式
  }
  return null
}
