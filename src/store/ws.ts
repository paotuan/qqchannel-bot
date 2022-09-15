import mitt from 'mitt'
import type { IMessage, Command } from '../../interface/common'

const ws = new WebSocket('ws://localhost:4174')
const wsEmitter = mitt()

ws.onopen = () => {
  console.log('successful connected to server')
}

ws.onmessage = (data) => {
  try {
    const resp = JSON.parse(data.data) as IMessage<unknown>
    wsEmitter.emit(resp.cmd, resp)
  } catch (e) {
    console.error('Error while parsing server msg', e)
  }
}

export default {
  on(cmd: Command, handler: (data: IMessage<unknown>) => void) {
    wsEmitter.on(cmd, data => handler(data as IMessage<unknown>))
  },
  send<T>(msg: IMessage<T>) {
    ws.send(JSON.stringify(msg))
  }
}
