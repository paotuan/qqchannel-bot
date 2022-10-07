import type { WebSocket } from 'ws'
import type { Wss } from './wss'
import type { IMessage } from '../../interface/common'
import { autorun, IReactionDisposer } from 'mobx'

/**
 * 一个 client 对应一个打开的网页
 */
export class WsClient {
  // 该 client 登录机器人的 appid
  appid = ''
  // 该 client 监听的频道 id
  listenToGuildId = ''
  // 该 client 监听的子频道 id
  listenToChannelId = ''

  private readonly ws: WebSocket
  private readonly disposers: IReactionDisposer[] = []

  constructor(ws: WebSocket, server: Wss) {
    this.ws = ws
    ws.on('message', (rawData: string) => {
      try {
        const body = JSON.parse(rawData) as IMessage<unknown>
        server.handleClientRequest(this, body)
      } catch (e) {
        console.error('消息处理失败', e)
        console.error('原始消息', rawData)
      }
    })

    ws.on('close', () => {
      console.log('客户端关闭')
      this.disposeAllEffects()
      server.removeClient(this)
    })

    ws.on('error', e => {
      console.error('客户端因发生错误而关闭', e)
      this.disposeAllEffects()
      server.removeClient(this)
    })
  }

  // 监听某个子频道
  listenTo(channelId: string, guildId: string) {
    this.listenToChannelId = channelId
    this.listenToGuildId = guildId
  }

  // 发送给网页
  send<T>(data: IMessage<T>) {
    this.ws.send(JSON.stringify(data))
  }

  // 注册 ws 相关的 effect
  autorun(effect: (ws: WsClient) => void) {
    const dispose = autorun(() => effect(this))
    this.disposers.push(dispose)
  }

  // 取消注册所有的 effect
  disposeAllEffects() {
    this.disposers.forEach(dispose => dispose())
    this.disposers.length = 0
  }
}
