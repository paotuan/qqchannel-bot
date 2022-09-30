import { AvailableIntentsEventsEnum, createOpenAPI, createWebsocket } from 'qq-guild-bot'
import type { IBotInfoRespV2 } from '../../../interface/common'
import { Guild } from './guild'

/**
 * A bot connection to QQ
 */
class QApi {
  readonly appid: string
  readonly token: string
  readonly botInfoPromise: Promise<IBotInfoRespV2 | null>
  private readonly qqClient: ReturnType<typeof createOpenAPI>
  private readonly qqWs: ReturnType<typeof createWebsocket>
  private readonly guilds: Guild[] = [] // 机器人所在频道信息。根据 QQ 的规范，不同机器人不能共享数据，且机器人权限可能不同。因此即使多个机器人加入了相同的频道，也应将它们的信息分开存储

  constructor(appid: string, token: string) {
    this.appid = appid
    this.token = token

    const botConfig = {
      appID: appid,
      token: token,
      intents: [
        AvailableIntentsEventsEnum.GUILD_MESSAGES,
        AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS
      ],
      sandbox: false,
    }
    this.qqClient = createOpenAPI(botConfig)
    this.qqWs = createWebsocket(botConfig)

    // todo 监听 intent
    // this.qqWs.on('')

    console.log('连接 QQ 服务器成功')

    // 获取 bot 基本信息
    this.botInfoPromise = this._botInfoPromise()
    // 获取 bot 所在频道信息
    this.fetchGuilds()
  }

  private _botInfoPromise(): Promise<IBotInfoRespV2 | null> {
    return new Promise(resolve => {
      this.qqClient.meApi.me().then(resp => {
        resolve({
          id: resp.data.id,
          username: resp.data.username.replace(/-测试中$/, ''),
          avatar: resp.data.avatar,
        })
      }).catch(e => {
        console.error('获取机器人信息失败', e)
        resolve(null)
      })
    })
  }

  async fetchGuilds() {
    this.guilds.length = 0
    try {
      const resp = await this.qqClient.meApi.meGuilds({ limit: 1 }) // 先只拉一个
      this.guilds.push(...resp.data.map(info => new Guild(info.id, info.name)))
    } catch (e) {
      console.error('获取频道信息失败', e)
    }
  }

  disconnect() {
    this.qqWs.disconnect()
  }
}

export class QApiManager {
  private readonly apis: Record<string, QApi> = {}

  // 登录 qq 机器人，建立与 qq 服务器的 ws
  login(appid: string, token: string) {
    const oldApi = this.apis[appid]
    if (oldApi) {
      if (oldApi.token === token) {
        console.log('已存在相同的 QQ 服务器连接，可直接复用')
        // todo 重连更新频道信息
        return // 无需重连
      } else {
        console.log('检测到相同 APPID 但不同 Token 的连接，重新连接...')
        oldApi.disconnect()
      }
    }
    this.apis[appid] = new QApi(appid, token)
  }

  // 获取对应 appid 的机器人 api
  api(appid: string) {
    return this.apis[appid]
  }
}
