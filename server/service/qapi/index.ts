import { AvailableIntentsEventsEnum, createOpenAPI, createWebsocket } from 'qq-guild-bot'
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

  constructor(appid: string, token: string, wss: Wss) {
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
      sandbox: false,
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

    // 初始化监听器 todo 初始化消息缓存
    botConfig.intents.forEach(intent => {
      this.qqWs.on(intent, data => this.eventEmitter.emit(intent, data))
    })

    // 初始化串行监听器
    this.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, async (data: any) => {
      // 过滤掉未监听的频道消息
      const channelId = data.msg.channel_id
      if (!this.wss.listeningChannels.includes(channelId)) return
      // 串行触发
      for (const listener of this.guildMessageQueueListeners) {
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
    this.qqWs.disconnect()
  }

  // nativeOn
  on(intent: AvailableIntentsEventsEnum, listener: (data: unknown) => void) {
    this.eventEmitter.on(intent, listener)
  }

  private readonly guildMessageQueueListeners: QueueListener[] = []

  onGuildMessage(listener: QueueListener) {
    this.guildMessageQueueListeners.push(listener)
  }
}
