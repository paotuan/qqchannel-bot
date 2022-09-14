import { WebSocketServer } from 'ws'
import type { WebSocket } from 'ws'
import type { ILoginReq, IMessage } from '../interface/common'
import { connectQQChannel } from './botclient'

const wss = new WebSocketServer({ port: 4174 })

wss.on('connection', (ws) => {
  ws.on('message', (rawData: string) => {
    try {
      const body = JSON.parse(rawData) as IMessage<unknown>
      if (body.cmd === 'bot/login') {
        const req = body.data as ILoginReq
        connectQQChannel(req)
        sendServerMessage(ws, { cmd: body.cmd, success: true, data: null })
      }
    } catch (e) {
      console.log('Error while handling message', e)
    }
  })
})

console.log('websocket server started')

export function sendServerMessage<T>(ws: WebSocket | null, message: IMessage<T>) {
  if (ws) {
    ws.send(JSON.stringify(message))
  } else {
    wss.clients.forEach(ws => {
      ws.send(JSON.stringify(message))
    })
  }
}
