import type { WsClient } from './wsclient'
import type { Wss } from './wss'
import type {
  IBotInfoRespV2,
  IChannel,
  IChannelListResp,
  IListenToChannelReq,
  ILoginReq,
  IMessage, IUser, IUserListResp
} from '../../interface/common'
import { QApiManager } from '../service/qapi'

export function dispatch(client: WsClient, server: Wss, request: IMessage<unknown>) {
  switch (request.cmd) {
  case 'bot/login':
    handleLogin(client, request.data as ILoginReq)
    break
  case 'channel/listen':
    handleListenToChannel(client, request.data as IListenToChannelReq)
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
      ws.send<IBotInfoRespV2>({ cmd: 'bot/info', success: true, data: qApi.botInfo })
    }
  })
  // watch guild & channel info
  client.autorun(ws => {
    const qApi = QApiManager.Instance.find(ws.appid)
    if (qApi) {
      const channels: IChannel[] = qApi.guilds.all.map(guild => guild.allChannels.map(channel => ({
        id: channel.id, name: channel.name, guildId: channel.guildId, guildName: guild.name
      }))).flat()
      ws.send<IChannelListResp>({ cmd: 'channel/list', success: true, data: channels })
    }
  })
}

function handleListenToChannel(client: WsClient, data: IListenToChannelReq) {
  client.listenTo(data.channelId, data.guildId)
  // watch user list
  client.autorun(ws => {
    const qApi = QApiManager.Instance.find(ws.appid)
    if (qApi) {
      const guild = qApi.guilds.find(ws.listenToGuildId)
      if (guild) {
        const users: IUser[] = guild.allUsers.map(user => ({
          id: user.id,
          nick: user.nick,
          username: user.username,
          avatar: user.avatar,
          bot: user.bot,
          deleted: user.deleted
        }))
        ws.send<IUserListResp>({ cmd: 'user/list', success: true, data: users })
      }
    }
  })
}
