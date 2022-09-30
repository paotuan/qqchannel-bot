import type { WebSocket } from 'ws'
import type { Wss } from './wss'
import type { IMessage } from '../../interface/common'

/**
 * 一个 client 对应一个打开的网页
 */
export class WsClient {
  // 该 client 登录机器人的 appid
  appid = ''
  // 该 client 监听的子频道 id
  listenToChannelId = ''

  private readonly ws: WebSocket

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
      server.removeClient(this)
    })

    ws.on('error', e => {
      console.error('客户端因发生错误而关闭', e)
      server.removeClient(this)
    })

    // todo send bot info
  }

  // 发送给网页
  send<T>(data: IMessage<T>) {
    this.ws.send(JSON.stringify(data))
  }
}
