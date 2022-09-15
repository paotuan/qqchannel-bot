import { WebSocketServer } from 'ws'
import type { WebSocket } from 'ws'
import type { IMessage, Command } from '../interface/common'
import { EventEmitter } from 'events'

const wss = new WebSocketServer({ port: 4174 })
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
})

console.log('websocket server started')

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
