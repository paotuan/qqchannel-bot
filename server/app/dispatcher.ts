import type { WsClient } from './wsclient'
import type { Wss } from './wss'
import { ILoginReq, IMessage } from '../../interface/common'
import { QApiManager } from '../service/qapi'

export function dispatch(client: WsClient, server: Wss, request: IMessage<unknown>) {
  switch (request.cmd) {
  case 'bot/login':
    handleLogin(client, request.data as ILoginReq)
    break
  }
}

function handleLogin(client: WsClient, data: ILoginReq) {
  // 1. 记录 appid
  client.appid = data.appid
  // 2. 连接 qq 服务器
  QApiManager.Instance.login(data.appid, data.token)
  // 3. 返回登录成功
  client.send({ cmd: 'bot/login', success: true, data: null })
  // 4. watch bot info
  client.autorun(ws => {
    const qApi = QApiManager.Instance.find(ws.appid)
    if (qApi?.botInfo) {
      ws.send({ cmd: 'bot/info', success: true, data: qApi.botInfo })
    }
  })
  // watch guild & channel info
  client.autorun(ws => {
    const qApi = QApiManager.Instance.find(ws.appid)
    if (qApi) {
      const channels = qApi.guilds.all.map(guild => guild.allChannels).flat() // todo 按 guilds 分组
      ws.send({ cmd: 'channel/list', success: true, data: channels.map(channel => ({ id: channel.id, name: channel.name })) })
    }
  })
}
