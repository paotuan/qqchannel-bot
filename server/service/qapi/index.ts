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

type QueueListener = (data: unknown) => Promise<boolean>

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
      channel && (channel.lastMessage = data.msg)
      // 串行触发消息处理器
      for (const listener of this.guildMessageQueueListeners) {
        const consumed = await listener(data)
        if (consumed) return
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
      // 串行触发消息处理器
      for (const listener of this.directMessageQueueListeners) {
        const consumed = await listener(data)
        if (consumed) return
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
    this.qqWs.disconnect()
    this.eventEmitter.removeAllListeners()
  }

  // nativeOn
  on(intent: AvailableIntentsEventsEnum, listener: (data: unknown) => void) {
    this.eventEmitter.on(intent, listener)
  }

  private readonly guildMessageQueueListeners: QueueListener[] = []
  private readonly directMessageQueueListeners: QueueListener[] = []

  onGuildMessage(listener: QueueListener) {
    this.guildMessageQueueListeners.push(listener)
  }

  onDirectMessage(listener: QueueListener) {
    this.directMessageQueueListeners.push(listener)
  }
}
