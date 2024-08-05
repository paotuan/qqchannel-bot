import type { WebSocket } from 'ws'
import type { Wss } from './wss'
import type { IMessage, IPluginConfigDisplay } from '@paotuan/types'
import type { BotId } from '../adapter/utils'
import { getChannelUnionId } from '../adapter/utils'

/**
 * 一个 client 对应一个打开的网页
 */
export class WsClient {
  // 该 client 登录机器人的 id
  private _botId?: BotId
  // 该 client 监听的频道 id
  private _listenToGuildId = ''
  // 该 client 监听的子频道 id
  private _listenToChannelId = ''

  private readonly server: Wss
  private readonly ws: WebSocket

  get botId() {
    return this._botId
  }

  get bot() {
    return this.server.bots.find(this.botId)
  }

  get platform() {
    return this.bot?.platform
  }

  get listenToGuildId() {
    return this._listenToGuildId
  }

  get listenToChannelId() {
    return this._listenToChannelId
  }

  get listenToChannelUnionId() {
    if (this.platform && this.listenToGuildId && this.listenToChannelId) {
      return getChannelUnionId(this.platform, this.listenToGuildId, this.listenToChannelId)
    } else {
      return undefined
    }
  }

  constructor(ws: WebSocket, server: Wss) {
    this.ws = ws
    this.server = server
    ws.on('message', (rawData: Buffer) => {
      try {
        const body = JSON.parse(rawData.toString()) as IMessage<unknown>
        this.server.handleClientRequest(this, body)
      } catch (e) {
        console.error('消息处理失败', e)
        console.error('原始消息', rawData)
      }
    })

    ws.on('close', () => {
      console.log('客户端关闭')
      this.server.removeClient(this)
    })

    ws.on('error', e => {
      console.error('客户端因发生错误而关闭', e)
      this.server.removeClient(this)
    })

    // 发送插件数据
    server.sendToClient<IPluginConfigDisplay[]>(this, { cmd: 'plugin/list', success: true, data: server.plugin.pluginListManifest })
  }

  // 客户端绑定某个 bot 实例
  bindToBot(botId: BotId) {
    this._botId = botId
  }

  // 客户端选择某个子频道
  listenTo(channelId: string, guildId: string) {
    this._listenToChannelId = channelId
    this._listenToGuildId = guildId
    // 也向对应的 bot 注册。即使 wsclient 关闭，bot 中也继续监听消息
    this.bot!.listenTo(channelId, guildId)
  }

  // 发送给网页
  send<T>(data: IMessage<T>) {
    this.ws.send(JSON.stringify(data))
  }
}
