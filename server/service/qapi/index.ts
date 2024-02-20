import { AvailableIntentsEventsEnum, createOpenAPI, createWebsocket, IMessage } from 'qq-guild-bot'
import type { IBotInfo } from '../../../interface/common'
import { GuildManager } from './guild'
import { action, makeAutoObservable } from 'mobx'
import type { Wss } from '../../app/wss'
import { LogManager } from './log'
import { EventEmitter } from 'events'
import { NoteManager } from './note'
import { DiceManager } from './dice'
import { CustomReplyManager } from './customReply'
import { parseUserCommand } from './utils'
import type { ParseUserCommandResult, IUserCommandContext } from '../../../interface/config'
import type { ICardEntryChangeEvent } from '../../../interface/card/types'

type QueueListener = (data: unknown) => Promise<boolean>
type CommandListener = (data: ParseUserCommandResult) => Promise<boolean>
type MessageReactionListener = (context: IUserCommandContext) => Promise<boolean>

/**
 * A bot connection to QQ
 */
export class QApi {
  readonly appid: string
  readonly token: string
  readonly sandbox: boolean
  readonly qqClient: ReturnType<typeof createOpenAPI>
  private readonly qqWs: ReturnType<typeof createWebsocket>
  readonly wss: Wss
  readonly guilds: GuildManager
  readonly logs: LogManager
  readonly notes: NoteManager
  readonly dice: DiceManager
  readonly customReply: CustomReplyManager
  private readonly eventEmitter = new EventEmitter()

  botInfo: IBotInfo | null = null

  constructor(appid: string, token: string, sandbox: boolean, wss: Wss) {
    makeAutoObservable<this, 'qqWs' | 'eventEmitter'>(this, {
      appid: false,
      token: false,
      qqClient: false,
      qqWs: false,
      wss: false,
      eventEmitter: false
    })

    this.appid = appid
    this.token = token
    this.sandbox = sandbox
    this.wss = wss

    const botConfig = {
      appID: appid,
      token: token,
      intents: [
        AvailableIntentsEventsEnum.GUILDS,
        AvailableIntentsEventsEnum.GUILD_MEMBERS,
        AvailableIntentsEventsEnum.GUILD_MESSAGES,
        AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS,
        AvailableIntentsEventsEnum.DIRECT_MESSAGE
      ],
      sandbox: sandbox,
    }
    this.qqClient = createOpenAPI(botConfig)
    this.qqWs = createWebsocket(botConfig)

    // todo token 错误场景
    console.log('连接 QQ 服务器成功')

    // 获取 bot 基本信息
    this.fetchBotInfo()
    // 初始化 bot 所在频道信息
    this.guilds = new GuildManager(this)
    // 初始化 log 记录
    this.logs = new LogManager(this)
    // 初始化重要笔记
    this.notes = new NoteManager(this)
    // 初始化自定义回复（优先级在骰子之前）
    this.customReply = new CustomReplyManager(this)
    // 初始化骰子
    this.dice = new DiceManager(this)

    // 初始化监听器
    botConfig.intents.forEach(intent => {
      this.qqWs.on(intent, data => this.eventEmitter.emit(intent, data))
    })

    // 初始化串行监听器
    this.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, async (data: any) => {
      const msg = data.msg as IMessage
      // 根据消息中的用户信息更新成员信息。撤回事件信息不完整不处理
      if (data.eventType === 'MESSAGE_CREATE') {
        this.guilds.addOrUpdateUserByMessage(msg)
        this.guilds.addGuildChannelByMessage(msg)
      }
      // 过滤掉未监听的频道消息
      const channelId = msg.channel_id
      if (!this.wss.listeningChannels.includes(channelId)) return
      // 最近一条消息缓存到 channel 对象中
      const channel = this.guilds.findChannel(channelId, msg.guild_id)
      channel && (channel.lastMessage = msg)

      // 只处理 MESSAGE_CREATE 事件，进行指令处理
      if (data.eventType === 'MESSAGE_CREATE') {
        // 统一对消息进行 parse，判断是否是需要处理的指令
        const parseResult = parseUserCommand(this, msg)
        if (!parseResult) return
        await this.dispatchCommand(parseResult)
      }
    })

    this.on(AvailableIntentsEventsEnum.DIRECT_MESSAGE, async (data: any) => {
      console.log(`[QApi][私信事件][${data.eventType}]`)
      // 根据消息中的用户信息更新成员信息。撤回事件信息不完整不处理
      if (data.eventType === 'DIRECT_MESSAGE_CREATE') {
        this.guilds.addOrUpdateUserByMessage(data.msg)
      }
      // 最近一条消息缓存到 user 对象中
      const user = this.guilds.findUser(data.msg.author.id, data.msg.src_guild_id) // 因为前面已经 addOrUpdateUserByMessage，所以一定存在一个永久的 user 对象
      user && (user.lastMessage = data.msg)

      // 只处理 DIRECT_MESSAGE_CREATE 事件
      if (data.eventType === 'DIRECT_MESSAGE_CREATE') {
        // 串行触发消息处理器
        for (const listener of this.directMessageQueueListeners) {
          const consumed = await listener(data)
          if (consumed) return
        }
      }
    })

    this.on(AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS,  async (data: any) => {
      const msg = data.msg
      // 过滤掉未监听的频道消息
      if (!this.wss.listeningChannels.includes(msg.channel_id)) return
      console.log(`[QApi][表情表态事件][${data.eventType}]`)

      // 只处理 MESSAGE_REACTION_ADD 事件
      if (data.eventType === 'MESSAGE_REACTION_ADD') {
        const userId = msg.user_id as string
        const guildId = msg.guild_id as string
        const user = this.guilds.findUser(userId, guildId)
        const username = user?.username ?? userId
        const context: IUserCommandContext = {
          botId: this.appid,
          userId,
          username,
          userRole: 'user', // todo 表情表态暂时不处理权限的问题，不方便拿到而且几乎不会用到
          msgId: data.eventId as string, // 用于回复被动消息，表情标题用的是 event id
          guildId,
          channelId: msg.channel_id as string,
          replyMsgId: msg.target.id as string, // 表情表态回复的消息
          realUser: { userId, username }
        }

        await this.dispatchMessageReaction(context)
      }
    })
  }

  private fetchBotInfo() {
    this.qqClient.meApi.me().then(action(
      resp => {
        this.botInfo = {
          id: resp.data.id,
          username: resp.data.username.replace(/-测试中$/, ''),
          avatar: resp.data.avatar,
        }
      }
    )).catch(e => {
      console.error('获取机器人信息失败', e)
    })
  }

  disconnect() {
    this.qqWs.removeAllListeners()
    try {
      this.qqWs.disconnect()
    } catch (e) {
      console.error('断开连接出错。若出现功能异常，请重启程序，否则可以无视。', e)
    }
    this.eventEmitter.removeAllListeners()
  }

  // nativeOn
  on(intent: AvailableIntentsEventsEnum, listener: (data: unknown) => void) {
    this.eventEmitter.on(intent, listener)
  }

  private readonly guildMessageQueueListeners: CommandListener[] = []
  private readonly directMessageQueueListeners: QueueListener[] = []
  private readonly messageReactionListeners: MessageReactionListener[] = []

  onGuildCommand(listener: CommandListener) {
    this.guildMessageQueueListeners.push(listener)
  }

  onDirectMessage(listener: QueueListener) {
    this.directMessageQueueListeners.push(listener)
  }

  onMessageReaction(listener: MessageReactionListener) {
    this.messageReactionListeners.push(listener)
  }

  // 分派命令
  async dispatchCommand(parseResult: ParseUserCommandResult) {
    const config = this.wss.config.getChannelConfig(parseResult.context.channelId)

    // 注册监听器
    const cardEntryChangeListener = (event: ICardEntryChangeEvent) => {
      config.hook_onCardEntryChange({ event, context: parseResult.context })
    }
    this.wss.cards.addCardEntryChangeListener(cardEntryChangeListener)

    // hook: OnReceiveCommandCallback 处理
    await config.hook_onReceiveCommand(parseResult)

    // 整体别名指令处理
    parseResult.command = config.parseAliasRoll_command(parseResult.command)

    // 串行触发消息处理器
    for (const listener of this.guildMessageQueueListeners) {
      const consumed = await listener(parseResult)
      if (consumed) break
    }

    // 取消监听器
    this.wss.cards.removeCardEntryChangeListener(cardEntryChangeListener)
  }

  // 分派表情
  async dispatchMessageReaction(context: IUserCommandContext) {
    const config = this.wss.config.getChannelConfig(context.channelId)

    // 注册监听器
    const cardEntryChangeListener = (event: ICardEntryChangeEvent) => {
      config.hook_onCardEntryChange({ event, context })
    }
    this.wss.cards.addCardEntryChangeListener(cardEntryChangeListener)

    // hook: OnMessageReaction 处理
    const handled = await config.hook_onMessageReaction({ context })
    // 这里给个特殊逻辑，如果由插件处理过，就不走默认的逻辑了（自动检测技能检定），否则会显得奇怪
    if (!handled) {
      for (const listener of this.messageReactionListeners) {
        const consumed = await listener(context)
        if (consumed) break
      }
    }

    // 取消监听器
    this.wss.cards.removeCardEntryChangeListener(cardEntryChangeListener)
  }
}
