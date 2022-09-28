import { WebSocketServer } from 'ws'
import type { WebSocket } from 'ws'
import type { IMessage, Command } from '../interface/common'
import { EventEmitter } from 'events'

const WSS_PORT = 4174
const wss = new WebSocketServer({ port: WSS_PORT })
const wssEmitter = new EventEmitter()

wss.on('connection', (ws) => {
  ws.on('message', (rawData: string) => {
    try {
      const body = JSON.parse(rawData) as IMessage<unknown>
      wssEmitter.emit(body.cmd, ws, body.data)
    } catch (e) {
      console.log('Error while handling message', e)
    }
  })
  // 连接后推送服务端人物卡列表
  wssEmitter.emit('card/list', ws)
})

console.log('WebSocket 已启动，端口号 ' + WSS_PORT)

export default {
  // 监听客户端事件
  on(cmd: Command, handler: (ws: WebSocket, data: unknown) => void) {
    wssEmitter.on(cmd, handler)
  },
  // 向客户端发消息
  send<T>(ws: WebSocket | null, message: IMessage<T>) {
    if (ws) {
      ws.send(JSON.stringify(message))
    } else {
      wss.clients.forEach(ws => {
        ws.send(JSON.stringify(message))
      })
    }
  }
}
