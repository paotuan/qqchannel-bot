import * as dotenv from 'dotenv'
import { AvailableIntentsEventsEnum, createOpenAPI, createWebsocket } from 'qq-guild-bot'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import type { ILoginReq } from '../interface/common'

dotenv.config()

interface IConnection {
  client: ReturnType<typeof createOpenAPI> | null
  ws: ReturnType<typeof createWebsocket> | null
}

const connection: IConnection = { client: null, ws: null }

export function connectQQChannel(params: ILoginReq) {
  // is it enough? 目前应该没这种场景
  if (connection.ws) {
    connection.ws.disconnect()
    connection.client = null
    connection.ws = null
  }

  const botConfig = {
    appID: params.appid, // 申请机器人时获取到的机器人 BotAppID
    token: params.token, // 申请机器人时获取到的机器人 BotToken
    intents: [AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES], // 事件订阅,用于开启可接收的消息类型
    sandbox: false, // 沙箱支持，可选，默认false. v2.7.0+
  }
  const client = connection.client = createOpenAPI(botConfig)
  const ws = connection.ws = createWebsocket(botConfig)

  ws.on(AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES, (data) => {
    const content = data.msg.content
    const channel = data.msg.channel_id
    const msg_id = data.msg.id
    const nickname = data.msg.member.nick

    try {
      const [, exp, ...desc] = content.split(/\s+/) // 第一个元素是 at消息体，无视之
      const roll = new DiceRoll(exp)
      // 返回结果
      const reply = `${nickname} 🎲 ${desc.join(' ')} ${roll.output}`
      client.messageApi.postMessage(channel, { content: reply, msg_id }).then((res) => {
        console.log(res.data)
      }).catch((err) => {
        console.log(err)
      })
    } catch (e) {
      // 表达式不合法，无视之
    }
  })

  console.log('successful connect to qq server')
}
