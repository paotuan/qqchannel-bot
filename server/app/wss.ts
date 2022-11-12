import { WebSocketServer } from 'ws'
import type { IMessage } from '../../interface/common'
import { WsClient } from './wsclient'
import { dispatch } from './dispatcher'
import { QApiManager } from '../service/QApiManager'
import { makeAutoObservable } from 'mobx'
import { CardManager } from '../service/CardManager'
import { ConfigManager } from '../service/config'

/**
 * The server is a singleton websocket server
 */
export class Wss {
  private readonly server: WebSocketServer
  private readonly clients: WsClient[] = []
  readonly qApis = new QApiManager(this)
  readonly cards = new CardManager(this)
  readonly config = new ConfigManager(this)
  private readonly _listeningChannels: string[] = []

  constructor(port = 4174) {
    makeAutoObservable<this, 'server'>(this, { server: false, qApis: false })
    this.server = new WebSocketServer({ port })
    console.log('WebSocket 服务已启动，端口号 ' + port)

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

  addListeningChannel(channelId: string) {
    if (!this._listeningChannels.includes(channelId)) {
      this._listeningChannels.push(channelId)
    }
  }

  // 当前正在监听的子频道 id 列表
  get listeningChannels() {
    // return this.clients.map(client => client.listenToChannelId).filter(id => !!id)
    return this._listeningChannels // 即使关闭了网页也让骰子继续工作
  }

  // 发消息给某个 client
  sendToClient<T>(client: WsClient, message: IMessage<T>) {
    client.send(message)
  }

  // 发消息给正在监听某个频道的所有 client
  sendToChannel<T>(channelId: string, message: IMessage<T>) {
    this.clients.filter(client => client.listenToChannelId === channelId).forEach(client => {
      client.send(message)
    })
  }
}
