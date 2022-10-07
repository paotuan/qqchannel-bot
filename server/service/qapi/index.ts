import { AvailableIntentsEventsEnum, createOpenAPI, createWebsocket } from 'qq-guild-bot'
import type { IBotInfo } from '../../../interface/common'
import { GuildManager } from './guild'
import { makeAutoObservable } from 'mobx'

/**
 * A bot connection to QQ
 */
export class QApi {
  readonly appid: string
  readonly token: string
  readonly qqClient: ReturnType<typeof createOpenAPI>
  readonly qqWs: ReturnType<typeof createWebsocket>
  readonly guilds: GuildManager

  botInfo: IBotInfo | null = null

  constructor(appid: string, token: string) {
    makeAutoObservable(this, {
      appid: false,
      token: false,
      qqClient: false,
      qqWs: false
    })

    this.appid = appid
    this.token = token

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
  }

  private fetchBotInfo() {
    this.qqClient.meApi.me().then(resp => {
      this.botInfo = {
        id: resp.data.id,
        username: resp.data.username.replace(/-测试中$/, ''),
        avatar: resp.data.avatar,
      }
    }).catch(e => {
      console.error('获取机器人信息失败', e)
    })
  }

  disconnect() {
    this.qqWs.disconnect()
  }
}

export class QApiManager {
  static readonly Instance = new QApiManager()

  private readonly apis: Record<string, QApi> = {}

  // singleton
  private constructor() {
    makeAutoObservable(this)
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
    this.apis[appid] = new QApi(appid, token)
  }

  // 获取对应 appid 的机器人 api
  find(appid: string) {
    return this.apis[appid]
  }
}
