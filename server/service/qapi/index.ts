import { AvailableIntentsEventsEnum, createOpenAPI, createWebsocket } from 'qq-guild-bot'
import type { IBotInfo } from '../../../interface/common'
import { GuildManager } from './guild'
import { action, makeAutoObservable } from 'mobx'
import type { Wss } from '../../app/wss'
import { LogManager } from './log'
import { EventEmitter } from 'events'
import { NoteManager } from './note'
import { DiceManager } from './dice'

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
    botConfig.intents.forEach(intent => {
      this.qqWs.on(intent, data => this.eventEmitter.emit(intent, data))
    })
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
    // 初始化骰子
    this.dice = new DiceManager(this)
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

  on(intent: AvailableIntentsEventsEnum, listener: (data: unknown) => void) {
    this.eventEmitter.on(intent, listener)
  }
}

export class QApiManager {
  private readonly wss: Wss
  private readonly apis: Record<string, QApi> = {}

  // singleton
  constructor(wss: Wss) {
    makeAutoObservable<this, 'wss'>(this, { wss: false })
    this.wss = wss
  }

  // 登录 qq 机器人，建立与 qq 服务器的 ws
  login(appid: string, token: string) {
    const oldApi = this.apis[appid]
    if (oldApi) {
      if (oldApi.token === token) {
        console.log('已存在相同的 QQ 服务器连接，可直接复用')
        return // 无需重连
      } else {
        console.log('检测到相同 APPID 但不同 Token 的连接，重新连接...')
        oldApi.disconnect()
      }
    }
    this.apis[appid] = new QApi(appid, token, this.wss)
  }

  // 获取对应 appid 的机器人 api
  find(appid: string) {
    return this.apis[appid]
  }
}
