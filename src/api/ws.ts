import mitt from 'mitt'
import type { IMessage, Command } from '../../interface/common'
import { useUIStore } from '../store/ui'

const ws = new WebSocket('ws://localhost:4174')
const wsEmitter = mitt()

ws.onopen = () => {
  console.log('已连接到服务端')
}

ws.onmessage = (data) => {
  try {
    const resp = JSON.parse(data.data) as IMessage<unknown>
    console.log(resp.cmd, resp)
    wsEmitter.emit(resp.cmd, resp)
  } catch (e) {
    console.error('Error while parsing server msg', e)
  }
}

ws.onclose = () => {
  useUIStore().connectionStatus = false
  console.log('连接已关闭')
}

ws.onerror = (data) => {
  useUIStore().connectionStatus = false
  console.error('连接已被异常关闭', data)
}

export default {
  on(cmd: Command, handler: (data: IMessage<unknown>) => void) {
    wsEmitter.on(cmd, data => handler(data as IMessage<unknown>))
  },
  send<T>(msg: IMessage<T>) {
    ws.send(JSON.stringify(msg))
  }
}
