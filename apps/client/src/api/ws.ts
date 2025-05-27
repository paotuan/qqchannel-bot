import mitt from 'mitt'
import type { IMessage, Command } from '@paotuan/types'
import { useUIStore } from '../store/ui'
import { wsEndpoint } from './endpoint'
import { useBotStore } from '../store/bot'

console.log('连接服务端……', wsEndpoint)
const ws = new WebSocket(wsEndpoint)
const wsEmitter = mitt()

ws.onopen = () => {
  console.log('已连接到服务端')
  // 时序问题，简单粗暴地把自动登录逻辑放在这里处理
  const bot = useBotStore()
  bot.tryAutoLogin()
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
  on<T = unknown>(cmd: Command, handler: (data: IMessage<T>) => void) {
    wsEmitter.on(cmd, data => handler(data as IMessage<T>))
  },
  once<T = unknown>(cmd: Command, handler: (data: IMessage<T>) => void) {
    const _handler = (data: any) => {
      wsEmitter.off(cmd, _handler)
      handler(data as IMessage<T>)
    }
    wsEmitter.on(cmd, _handler)
  },
  off(cmd: Command) {
    wsEmitter.off(cmd)
  },
  send<T>(msg: IMessage<T>) {
    ws.send(JSON.stringify(msg))
  }
}
