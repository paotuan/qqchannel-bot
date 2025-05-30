import { WebSocketServer } from 'ws'
import type { IMessage } from '@paotuan/types'
import { WsClient } from './wsclient'
import { dispatch } from './dispatcher'
import { CardManager } from '../service/card'
import { ConfigManager } from '../service/config'
import { PluginManager } from '../service/plugin'
import { BotManager } from '../adapter/BotManager'
import { ChannelUnionId } from '../adapter/utils'

/**
 * The server is a singleton websocket server
 */
export class Wss {
  readonly httpPort: number
  readonly server: WebSocketServer
  private readonly clients: WsClient[] = []
  readonly bots = new BotManager(this)
  readonly cards = new CardManager(this)
  readonly plugin = new PluginManager(this)
  readonly config = new ConfigManager()

  constructor(httpPort: number) {
    this.httpPort = httpPort
    this.server = new WebSocketServer({ noServer: true })

    this.server.on('close', () => {
      console.log('WebSocket 服务已关闭')
    })

    this.server.on('error', e => {
      console.error('WebSocket 服务出错', e)
    })

    this.server.on('connection', ws => {
      console.log('已接入新的客户端')
      this.clients.push(new WsClient(ws, this))
    })
  }

  handleClientRequest(client: WsClient, request: IMessage<unknown>) {
    dispatch(client, this, request)
  }

  removeClient(client: WsClient) {
    const index = this.clients.indexOf(client)
    if (index >= 0) {
      this.clients.splice(index, 1)
    }
  }

  // 发消息给某个 client
  sendToClient<T>(client: WsClient, message: IMessage<T>) {
    client.send(message)
  }

  // 发消息给某个登录了该 bot 的 client
  sendToBot<T>(botId: string, message: IMessage<T>) {
    this.clients.filter(client => client.botId === botId).forEach(client => client.send(message))
  }

  // 发消息给正在监听某个频道的所有 client
  sendToChannel<T>(channelUnionId: ChannelUnionId, message: IMessage<T>) {
    this.clients.filter(client => client.listenToChannelUnionId === channelUnionId).forEach(client => {
      client.send(message)
    })
  }

  // sendToGuild<T>(guildId: string, message: IMessage<T>) {
  //   this.clients.filter(client => client.listenToGuildId === guildId).forEach(client => {
  //     client.send(message)
  //   })
  // }

  // 发消息给全部 client
  sendToAll<T>(message: IMessage<T>) {
    this.clients.forEach(client => client.send(message))
  }
}
