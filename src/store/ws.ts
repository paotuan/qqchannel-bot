import type { IMessage } from '../../interface/common'
import { BotService } from './bot'

const ws = new WebSocket('ws://localhost:4174')

ws.onopen = () => {
  console.log('successful connected to server')
}

ws.onmessage = (data) => {
  try {
    const resp = JSON.parse(data.data) as IMessage<unknown>
    if (resp.cmd.startsWith('bot/')) {
      BotService.handleMessage(resp)
    }
  } catch (e) {
    console.error('Error while parsing server msg', e)
  }
}

export function sendMessage<T>(msg: IMessage<T>) {
  ws.send(JSON.stringify(msg))
}
