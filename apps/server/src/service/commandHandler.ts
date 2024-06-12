import LRUCache from 'lru-cache'
import { makeAutoObservable } from 'mobx'
import type { BotContext, ICommand } from '@paotuan/config'
import {
  CardProvider,
  DefaultRiState,
  dispatchCommand,
  dispatchReaction,
  IDispatchResult, IRiItem, RiProvider,
  StandardDiceRoll
} from '@paotuan/dicecore'
import type { IDiceRollReq } from '@paotuan/types'
import type { Bot } from '../adapter/Bot'
import { qqguildV1_getMessageContent } from '../adapter/qqguild-v1'
import type { WsClient } from '../app/wsclient'
import type { ChannelUnionId } from '../adapter/utils'

interface IMessageCache {
  text?: string
  instruction?: string | null // 文本消息是否包含指令。第一次使用时解析（undefined: 未解析，null：解析了但是为空）
}

export class CommandHandler {
  private readonly bot: Bot
  // 消息内容缓存
  private readonly msgCache: LRUCache<string, IMessageCache> = new LRUCache({
    max: 50,
    fetchMethod: async key => {
      const [channelId, msgId] = key.split('$$$')
      const content = await (async () => {
        if (this.bot.platform === 'qqguild') {
          return await qqguildV1_getMessageContent(this.bot, channelId, msgId)
        } else {
          const message = await this.bot.api.getMessage(channelId, msgId)
          return message.content
        }
      })()
      const text = content?.trim()
      return { text, instruction: text ? undefined : null } as IMessageCache // 非文本消息就直接记录为 null 了
    }
  })
  // 对抗检定缓存 msgid => roll
  private readonly opposedRollCache: LRUCache<string, StandardDiceRoll> = new LRUCache({ max: 50 })
  // 先攻列表缓存 channelId => ri list
  private readonly riListCache: Record<ChannelUnionId, IRiItem[]> = {}

  constructor(bot: Bot) {
    makeAutoObservable(this)
    this.bot = bot
    // 初始化先攻列表 store
    RiProvider.setState(new RiState(this.riListCache))
  }

  /**
   * 处理指令
   */
  async handleCommand(userCommand: ICommand<BotContext>) {
    const result = await dispatchCommand(userCommand, {
      getOpposedRoll: c => this.getOpposedRoll(c as ICommand<BotContext>),
      interceptor: async c => this.bot.logs.handleBackgroundLogCommand(c as ICommand<BotContext>),
    })
    await this.handleDispatchResult(userCommand, result)
  }

  /**
   * 处理表情表态
   */
  async handleReaction(userCommand: ICommand<BotContext>) {
    const result = await dispatchReaction(userCommand, {
      getReactionCommand: c => this.getInstruction(c as ICommand<BotContext>)
    })
    if (result) {
      await this.handleDispatchResult(userCommand, result)
    }
  }

  /**
   * 从网页端手动发起代骰
   */
  async manualDiceRollFromWeb(wsClient: WsClient, { expression, cardData }: IDiceRollReq) {
    const { listenToChannelUnionId: channelUnionId, listenToGuildId: guildId, listenToChannelId: channelId } = wsClient
    const config = this.bot.wss.config.getChannelConfig(channelUnionId!)
    const userCommand: ICommand<BotContext> = {
      command: expression,
      context: {
        botId: this.bot.id,
        userId: MockSystemUserId,
        username: cardData.name,
        userRole: 'admin',
        platform: this.bot.platform,
        guildId,
        channelId,
        channelUnionId: channelUnionId!,
        isDirect: false,
        realUser: {
          userId: config.botOwner ?? MockSystemUserId,
          username: cardData.name
        }
      }
    }
    // 临时注册一份 card 和 link
    CardProvider.registerCard(MockSystemCardId, cardData)
    CardProvider.linkCard(channelUnionId!, MockSystemCardId, MockSystemUserId)
    // 处理指令
    const result = await dispatchCommand(userCommand)
    await this.handleDispatchResult(userCommand, result)
  }

  private async handleDispatchResult(userCommand: ICommand<BotContext>, result: IDispatchResult) {
    let msgSent = false
    switch (result.type) {
    // 处理自定义回复
    case 'customReply': {
      if (result.reply) {
        this.sendMessage(userCommand, result.reply)
      }
      msgSent = true // 自定义回复可能在插件中已经回复了，此处默认为 true
      break
    }
    case 'interceptor':
      if (typeof result.payload === 'string') {
        this.sendMessage(userCommand, result.payload)
        msgSent = true
      }
      break
    // 处理掷骰结果
    case 'dice': {
      if (result.diceRoll) {
        const { context } = userCommand
        const roll = result.diceRoll
        if (roll instanceof StandardDiceRoll && roll.hidden && !context.isDirect) { // 处理非私信场景的暗骰
          const channelMsg = roll.t('roll.hidden', { 描述: roll.description })
          this.sendMessage(userCommand, channelMsg)
          // 暗骰始终发送给消息发送人，不考虑代骰
          this.sendMessage(userCommand, roll.output, context.realUser.userId)
        } else {
          const replyMsg = await this.sendMessage(userCommand, roll.output)
          // 如果是可供对抗的投骰，记录下缓存
          if (replyMsg && roll instanceof StandardDiceRoll && roll.eligibleForOpposedRoll) {
            this.opposedRollCache.set(replyMsg.id, roll)
          }
        }
        msgSent = true
      }
      // 保存人物卡更新
      if (result.affectedCards) {
        result.affectedCards.forEach(card => {
          this.bot.wss.cards.saveCard(card)
        })
      }
      break
    }
    }

    if (!msgSent && userCommand.context.isDirect) {
      // 私信至少给个回复吧，不然私信机器人3条达到限制了就很尴尬
      const selfNick = this.bot.botInfo?.username || ''
      await this.sendMessage(userCommand, `${selfNick}在的说`)
    }
  }

  // 获取对抗骰
  private async getOpposedRoll(userCommand: ICommand<BotContext>) {
    const replyMsgId = userCommand.context.replyMsgId
    return replyMsgId ? this.opposedRollCache.get(replyMsgId) : undefined
  }

  // 从文本内容中提取可能存在的指令
  private async getInstruction(userCommand: ICommand<BotContext>) {
    const { channelId, msgId } = userCommand.context
    if (!msgId) return
    // 获取原始消息
    const cacheMsg = await this.msgCache.fetch(`${channelId}$$$${msgId}`)
    if (!cacheMsg || cacheMsg.instruction === null) return
    if (typeof cacheMsg.instruction === 'undefined') {
      cacheMsg.instruction = detectInstruction(cacheMsg.text || '')
    }
    return cacheMsg.instruction ?? undefined
  }

  // 发送消息
  // 如传入 forceUserId，则强制发给对应 user
  // 否则根据 isDirect 决定发给人或发给频道
  async sendMessage(userCommand: ICommand<BotContext>, content: string, forceUserId?: string) {
    let { isDirect, userId } = userCommand.context
    const { channelId, guildId } = userCommand.context
    if (forceUserId) {
      isDirect = true
      userId = forceUserId
    }
    if (isDirect) {
      const user = this.bot.guilds.findUser(userId, guildId)
      if (!user) {
        console.warn(`[SendMessage] 找不到用户, userId=${userId}, guildId=${guildId}`)
        return
      }
      return user.sendMessage(content, userCommand.session)
    } else {
      const channel = this.bot.guilds.findChannel(channelId, guildId)
      if (!channel) {
        console.warn(`[SendMessage] 找不到频道, channelId=${channelId}, guildId=${guildId}`)
        return
      }
      return channel.sendMessage(content, userCommand.session)
    }
  }
}

const MockSystemCardId = '__temp_card_id__'
const MockSystemUserId = '__temp_user_id__'

// 先屏蔽 system card 的先攻
class RiState extends DefaultRiState {
  override updateRiList(channelUnionId: string, change: Partial<IRiItem>[]) {
    super.updateRiList(channelUnionId, change.filter(item => item.id !== MockSystemUserId))
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
